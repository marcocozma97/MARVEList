package com.marvelist.backend;

import com.marvelist.backend.config.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.transaction.CannotCreateTransactionException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void conIlDatabaseIrraggiungibileRispondeServizioNonDisponibile() {
        for (Exception e : new Exception[]{
                new CannotCreateTransactionException("Connection is not available"),
                new DataAccessResourceFailureException("timeout"),
                new InternalAuthenticationServiceException("Connection is not available")}) {
            var response = handler.handleUnavailable(e);
            assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
            assertEquals("Servizio momentaneamente non disponibile: riprova tra qualche minuto.", response.getBody().get("message"));
        }
    }
}
