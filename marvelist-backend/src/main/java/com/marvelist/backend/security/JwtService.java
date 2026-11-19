package com.marvelist.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.marvelist.backend.entities.User;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpiration;

    // Estrazione dell'email (username) dal token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Istante dell'ultimo cambio password (in millisecondi) a cui appartiene il token
    private static final String PASSWORD_CLAIM = "pwc";

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (userDetails instanceof User user && user.getPasswordChangedAt() != null) {
            claims.put(PASSWORD_CLAIM, user.getPasswordChangedAt().toEpochMilli());
        }
        return generateToken(claims, userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256) // Firma con l'algoritmo HMAC SHA-256
                .compact();
    }

    // Controlla se il token è valido per l'utente specifico
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token)
                && matchesCurrentPassword(extractAllClaims(token), userDetails);
    }

    // Dopo un cambio o un recupero della password le sessioni aperte prima vengono chiuse:
    // il token vale solo se è stato emesso dopo l'ultimo cambio (stesso istante salvato nel token)
    private boolean matchesCurrentPassword(Claims claims, UserDetails userDetails) {
        if (!(userDetails instanceof User user) || user.getPasswordChangedAt() == null) return true;
        return claims.get(PASSWORD_CLAIM) instanceof Number changedAt
                && changedAt.longValue() == user.getPasswordChangedAt().toEpochMilli();
    }

    // Come sopra, per il rinnovo della sessione: il token può essere già scaduto
    public boolean matchesCurrentPasswordForRefresh(String token, UserDetails userDetails) {
        try {
            return matchesCurrentPassword(extractAllClaims(token), userDetails);
        } catch (ExpiredJwtException e) {
            return matchesCurrentPassword(e.getClaims(), userDetails);
        } catch (RuntimeException e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Email di un token con firma valida anche se è scaduto, purché da non più di "grace";
    // null se il token è falso, alterato o scaduto da troppo tempo
    public String extractUsernameForRefresh(String token, java.time.Duration grace) {
        Claims claims;
        try {
            claims = extractAllClaims(token);
        } catch (ExpiredJwtException e) {
            claims = e.getClaims();
        } catch (RuntimeException e) {
            return null;
        }
        Date expiration = claims.getExpiration();
        if (expiration == null || expiration.toInstant().plus(grace).isBefore(java.time.Instant.now())) return null;
        return claims.getSubject();
    }

    // Decodifica la chiave segreta
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}