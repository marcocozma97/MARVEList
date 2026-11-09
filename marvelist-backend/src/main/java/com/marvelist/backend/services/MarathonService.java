package com.marvelist.backend.services;

import com.marvelist.backend.dto.MarathonDtos.*;
import com.marvelist.backend.entities.Marathon;
import com.marvelist.backend.entities.MarathonItem;
import com.marvelist.backend.entities.Media;
import com.marvelist.backend.entities.User;
import com.marvelist.backend.repositories.MarathonRepository;
import com.marvelist.backend.repositories.MediaRepository;
import com.marvelist.backend.repositories.UserProgressRepository;
import com.marvelist.backend.repositories.UserRepository;
import com.marvelist.backend.services.MarathonScheduler.Rules;
import com.marvelist.backend.services.MarathonScheduler.Unit;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarathonService {

    private static final Set<String> VISION_ORDERS = Set.of("MCU", "FAN", "GOD");
    private static final int MAX_BACKGROUND_LENGTH = 3_000_000; // ~2MB di immagine in base64
    private static final DateTimeFormatter IT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MarathonRepository marathonRepository;
    private final MediaRepository mediaRepository;
    private final UserRepository userRepository;
    private final MediaService mediaService;
    private final UserProgressRepository progressRepository;

    // --- LETTURA ---

    @Transactional(readOnly = true)
    public List<MarathonSummary> list(String email) {
        return marathonRepository.findAllByUserOrderByStartDateAscIdAsc(findUser(email)).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicMarathon> lists(User owner) {
        return marathonRepository.findAllByUserOrderByStartDateAscIdAsc(owner).stream()
                .map(m -> new PublicMarathon(m.getId(), m.getName(), m.getBackground(), m.getVisionOrder(),
                        m.getStartDate(), m.getEndDate(), m.getItems().stream().map(i -> i.getMedia().getId()).toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public MarathonDetail get(String email, Long id) {
        return toDetail(findMarathon(email, id));
    }

    // Anteprima del piano mentre l'utente compila il form, senza salvare nulla
    @Transactional(readOnly = true)
    public PlanResponse preview(String email, MarathonRequest request) {
        validate(request);
        User user = findUser(email);
        Set<Long> skipped = watchLaterIds(user);
        Map<Long, Set<Integer>> seenEpisodes = seenEpisodes(user, request.hideSeen());
        List<Media> media = loadMedia(request.mediaIds()).stream().filter(m -> !skipped.contains(m.getId())).toList();
        requireReleasedWithin(media, request.endDate());
        List<Unit> units = new ArrayList<>();
        media.forEach(m -> units.addAll(unitsOf(m, null, LocalDate.now(), seenEpisodes.getOrDefault(m.getId(), Set.of()))));
        return toPlan(media, units, plan(units, request), seenEpisodes, Map.of());
    }

    // --- SCRITTURA ---

    @Transactional
    public MarathonDetail create(String email, MarathonRequest request) {
        validate(request);
        Marathon marathon = Marathon.builder().user(findUser(email)).build();
        apply(marathon, request);
        return toDetail(marathonRepository.save(marathon));
    }

    @Transactional
    public MarathonDetail update(String email, Long id, MarathonRequest request) {
        validate(request);
        Marathon marathon = findMarathon(email, id);
        apply(marathon, request);
        return toDetail(marathonRepository.save(marathon));
    }

    @Transactional
    public void delete(String email, Long id) {
        marathonRepository.delete(findMarathon(email, id));
    }

    // Spunta di un film/episodio: viene segnato come visto anche nel profilo. Nel calendario resta (barrato)
    // fino a fine giornata, così i contenuti dei giorni successivi non scivolano su oggi
    @Transactional
    public MarathonDetail check(String email, Long id, CheckRequest request) {
        Marathon marathon = findMarathon(email, id);
        MarathonItem item = marathon.getItems().stream()
                .filter(i -> i.getMedia().getId().equals(request.mediaId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Titolo non presente nella maratona"));

        boolean isFilm = "FILM".equals(item.getMedia().getType());
        LocalDate today = LocalDate.now();
        if (isFilm) {
            item.setDone(request.done());
            item.setDoneDate(request.done() ? today : null);
        } else {
            Integer episode = request.episode();
            if (episode == null || episode < 1 || episode > episodeCount(item.getMedia())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episodio non valido");
            }
            if (request.done()) {
                item.getDoneEpisodes().add(episode);
                item.getEpisodeDoneDates().put(episode, today);
            } else {
                item.getDoneEpisodes().remove(episode);
                item.getEpisodeDoneDates().remove(episode);
            }
        }

        mediaService.markUnitWatched(email, item.getMedia().getId(), isFilm ? null : request.episode(), request.done());
        return toDetail(marathonRepository.save(marathon));
    }

    // --- LOGICA ---

    // Applica il form alla maratona: i titoli già presenti conservano quello che era stato spuntato
    private void apply(Marathon marathon, MarathonRequest request) {
        List<Media> media = loadMedia(request.mediaIds());
        requireReleasedWithin(media, request.endDate());
        List<Unit> units = new ArrayList<>();
        Map<Long, MarathonItem> existing = marathon.getItems().stream()
                .collect(Collectors.toMap(i -> i.getMedia().getId(), Function.identity(), (a, b) -> a));
        LocalDate today = LocalDate.now();
        // I titoli in "Guarda dopo" restano nella maratona ma non vanno in calendario
        Set<Long> skipped = watchLaterIds(marathon.getUser());
        Map<Long, Set<Integer>> seenEpisodes = seenEpisodes(marathon.getUser(), request.hideSeen());
        media.stream().filter(m -> !skipped.contains(m.getId()))
                .forEach(m -> units.addAll(unitsOf(m, existing.get(m.getId()), today, seenEpisodes.getOrDefault(m.getId(), Set.of()))));

        // Prima di salvare: se non c'è il tempo materiale, si chiede di cambiare le date o i limiti
        MarathonScheduler.Result result = plan(units, request);
        if (!result.feasible()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, infeasibleMessage(result));
        }

        marathon.setName(request.name().trim());
        marathon.setBackground(request.background());
        marathon.setVisionOrder(request.visionOrder());
        marathon.setStartDate(request.startDate());
        marathon.setEndDate(request.endDate());
        marathon.setHideSeen(request.hideSeen());
        marathon.setMixedDays(request.mixedDays());
        marathon.setMaxFilmsPerWeek(request.maxFilmsPerWeek());
        marathon.setMaxEpisodesPerDay(request.maxEpisodesPerDay());

        // Titoli tolti dal form -> eliminati; titoli rimasti -> nuova posizione
        Set<Long> keep = media.stream().map(Media::getId).collect(Collectors.toSet());
        marathon.getItems().removeIf(i -> !keep.contains(i.getMedia().getId()));
        for (int position = 0; position < media.size(); position++) {
            Media m = media.get(position);
            MarathonItem item = existing.get(m.getId());
            if (item == null) {
                item = MarathonItem.builder().marathon(marathon).media(m).build();
                marathon.getItems().add(item);
            }
            item.setPosition(position);
        }
        marathon.getItems().sort(Comparator.comparingInt(MarathonItem::getPosition));
    }

    private MarathonScheduler.Result plan(List<Unit> units, MarathonRequest request) {
        return MarathonScheduler.plan(units, effectiveStart(request.startDate()), request.endDate(),
                new Rules(request.maxFilmsPerWeek(), request.maxEpisodesPerDay(), request.mixedDays()));
    }

    private MarathonScheduler.Result plan(Marathon marathon, List<Unit> units) {
        return MarathonScheduler.plan(units, effectiveStart(marathon.getStartDate()), marathon.getEndDate(),
                new Rules(marathon.getMaxFilmsPerWeek(), marathon.getMaxEpisodesPerDay(), marathon.isMixedDays()));
    }

    // Il calendario parte sempre da oggi (o dall'inizio, se è nel futuro): i giorni passati non contano più
    private static LocalDate effectiveStart(LocalDate start) {
        LocalDate today = LocalDate.now();
        return start.isAfter(today) ? start : today;
    }

    // Unità da mettere in calendario: quelle da vedere più quelle spuntate oggi
    private List<Unit> scheduledUnits(Marathon marathon) {
        LocalDate today = LocalDate.now();
        Set<Long> skipped = watchLaterIds(marathon.getUser());
        Map<Long, Set<Integer>> seenEpisodes = seenEpisodes(marathon.getUser(), marathon.isHideSeen());
        List<Unit> units = new ArrayList<>();
        marathon.getItems().stream()
                .filter(i -> !skipped.contains(i.getMedia().getId()))
                .forEach(i -> units.addAll(unitsOf(i.getMedia(), i, today, seenEpisodes.getOrDefault(i.getMedia().getId(), Set.of()))));
        return units;
    }

    private Map<Long, Set<Integer>> seenEpisodes(User user, boolean hideSeen) {
        if (!hideSeen) return Map.of();
        Map<Long, Set<Integer>> seen = new HashMap<>();
        progressRepository.findAllByUser(user).forEach(p -> seen.put(p.getMedia().getId(), Set.copyOf(p.getWatchedEpisodes())));
        return seen;
    }

    private static int excludedEpisodes(Media media, MarathonItem item, Set<Integer> seen) {
        if ("FILM".equals(media.getType()) || seen.isEmpty()) return 0;
        int count = 0;
        for (int ep = 1; ep <= episodeCount(media); ep++) {
            if (seen.contains(ep) && (item == null || !item.getDoneEpisodes().contains(ep))) count++;
        }
        return count;
    }

    private int totalUnits(Marathon marathon, List<Media> media) {
        Map<Long, Set<Integer>> seen = seenEpisodes(marathon.getUser(), marathon.isHideSeen());
        Map<Long, MarathonItem> items = marathon.getItems().stream()
                .collect(Collectors.toMap(i -> i.getMedia().getId(), Function.identity(), (a, b) -> a));
        return totalUnits(media) - media.stream()
                .mapToInt(m -> excludedEpisodes(m, items.get(m.getId()), seen.getOrDefault(m.getId(), Set.of())))
                .sum();
    }

    // Titoli che l'utente ha messo in "Guarda dopo": la maratona li salta e non li conta
    private static Set<Long> watchLaterIds(User user) {
        return user.getWatchLaterMedia().stream().map(Media::getId).collect(Collectors.toSet());
    }

    // Titoli della maratona che contano (quelli in "Guarda dopo" sono saltati)
    private static List<Media> countedMedia(Marathon marathon, Set<Long> skipped) {
        return marathon.getItems().stream().map(MarathonItem::getMedia).filter(m -> !skipped.contains(m.getId())).toList();
    }

    private static int pendingCount(List<Unit> units) {
        return (int) units.stream().filter(u -> !u.done()).count();
    }

    // Un film è una sola unità; una serie è un'unità per ogni episodio non ancora spuntato.
    // Ciò che è stato spuntato oggi resta come unità "done", così tiene il suo posto nel calendario di oggi.
    // I titoli in arrivo portano con sé il giorno di uscita: prima di quello il calendario non li mette.
    private static List<Unit> unitsOf(Media media, MarathonItem item, LocalDate today, Set<Integer> seenEpisodes) {
        LocalDate availableFrom = availableFrom(media);
        if ("FILM".equals(media.getType())) {
            if (item == null || !item.isDone()) return List.of(new Unit(media.getId(), null, true, availableFrom));
            return today.equals(item.getDoneDate()) ? List.of(new Unit(media.getId(), null, true, availableFrom, true)) : List.of();
        }
        List<Unit> units = new ArrayList<>();
        for (int ep = 1; ep <= episodeCount(media); ep++) {
            LocalDate episodeFrom = episodeAvailableFrom(media, ep, availableFrom);
            boolean checked = item != null && item.getDoneEpisodes().contains(ep);
            if (!checked && seenEpisodes.contains(ep)) continue;
            if (!checked) units.add(new Unit(media.getId(), ep, false, episodeFrom));
            else if (today.equals(item.getEpisodeDoneDates().get(ep))) units.add(new Unit(media.getId(), ep, false, episodeFrom, true));
        }
        return units;
    }

    public static LocalDate episodeAvailableFrom(Media media, int episode, LocalDate seasonFrom) {
        List<LocalDate> dates = EpisodeSchedule.dates(media);
        LocalDate date = episode <= dates.size() ? dates.get(episode - 1) : null;
        if (date == null && !dates.isEmpty() && !EpisodeSchedule.isEpisodeOut(media, episode, EpisodeSchedule.today())) {
            date = dates.stream().filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
        }
        if (date == null) return seasonFrom;
        return seasonFrom != null && seasonFrom.isAfter(date) ? seasonFrom : date;
    }

    // Giorno da cui un titolo in arrivo si può vedere: la data TMDB se c'è, altrimenti il 31/12 dell'anno
    // del JSON (ipotesi prudente: meglio programmarlo tardi che prima che esca)
    static LocalDate availableFrom(Media media) {
        if (!Boolean.TRUE.equals(media.getUpcoming())) return null;
        if (media.getReleaseDate() != null) return media.getReleaseDate();
        return media.getReleaseYear() != null ? LocalDate.of(media.getReleaseYear(), 12, 31) : LocalDate.MAX;
    }

    // Un titolo in arrivo può entrare nella maratona solo se esce entro la data di fine
    private void requireReleasedWithin(List<Media> media, LocalDate endDate) {
        media.stream()
                .filter(m -> { LocalDate from = availableFrom(m); return from != null && from.isAfter(endDate); })
                .findFirst()
                .ifPresent(m -> bad("\"" + m.getTitle() + "\" è in arrivo ed esce dopo la fine della maratona: toglilo o sposta la data di fine"));
    }

    private static int episodeCount(Media media) {
        return media.getEpisodes() != null && media.getEpisodes() > 0 ? media.getEpisodes() : 1;
    }

    private static int totalUnits(Collection<Media> media) {
        return media.stream().mapToInt(m -> "FILM".equals(m.getType()) ? 1 : episodeCount(m)).sum();
    }

    private static String infeasibleMessage(MarathonScheduler.Result result) {
        if (result.requiredEndDate() == null) {
            return "Con questi limiti non riuscirai mai a finire: aumenta i film a settimana o gli episodi al giorno.";
        }
        return "Non c'è il tempo materiale per vedere tutto: sposta la data di fine almeno al "
                + result.requiredEndDate().format(IT_DATE) + " oppure aumenta i film a settimana o gli episodi al giorno.";
    }

    private PlanResponse toPlan(List<Media> media, List<Unit> units, MarathonScheduler.Result result,
                                Map<Long, Set<Integer>> seenEpisodes, Map<Long, MarathonItem> items) {
        int films = (int) media.stream().filter(m -> "FILM".equals(m.getType())).count();
        int episodes = media.stream().filter(m -> !"FILM".equals(m.getType()))
                .mapToInt(m -> episodeCount(m) - excludedEpisodes(m, items.get(m.getId()), seenEpisodes.getOrDefault(m.getId(), Set.of())))
                .sum();
        return new PlanResponse(result.feasible(), result.requiredEndDate(), films, episodes, pendingCount(units),
                result.unscheduled(), result.days().size(), result.feasible() ? null : infeasibleMessage(result));
    }

    private MarathonSummary toSummary(Marathon marathon) {
        List<Media> media = countedMedia(marathon, watchLaterIds(marathon.getUser()));
        List<Unit> units = scheduledUnits(marathon);
        MarathonScheduler.Result result = plan(marathon, units);
        int total = totalUnits(marathon, media);
        return new MarathonSummary(marathon.getId(), marathon.getName(), marathon.getBackground(), marathon.getVisionOrder(),
                marathon.getStartDate(), marathon.getEndDate(), total, total - pendingCount(units), result.feasible(),
                result.days().isEmpty() ? null : result.days().get(0).date());
    }

    private MarathonDetail toDetail(Marathon marathon) {
        Set<Long> skipped = watchLaterIds(marathon.getUser());
        List<Media> media = countedMedia(marathon, skipped);
        Map<Long, Media> byId = media.stream().collect(Collectors.toMap(Media::getId, Function.identity(), (a, b) -> a));
        List<Unit> units = scheduledUnits(marathon);
        MarathonScheduler.Result result = plan(marathon, units);
        int total = totalUnits(marathon, media);

        List<ItemResponse> items = marathon.getItems().stream().map(i -> new ItemResponse(
                i.getMedia().getId(), i.getMedia().getTitle(), i.getMedia().getType(), i.getMedia().getPosterPath(),
                i.getMedia().getEpisodes(), i.isDone(), i.getDoneEpisodes().stream().sorted().toList(),
                skipped.contains(i.getMedia().getId()))).toList();

        List<DayResponse> days = result.days().stream().map(day -> new DayResponse(day.date(), day.units().stream().map(u -> {
            Media m = byId.get(u.mediaId());
            return new UnitResponse(m.getId(), m.getTitle(), m.getType(), m.getPosterPath(), u.episode(), m.getRuntime(), u.done());
        }).toList())).toList();

        return new MarathonDetail(marathon.getId(), marathon.getName(), marathon.getBackground(), marathon.getVisionOrder(),
                marathon.getStartDate(), marathon.getEndDate(), marathon.isHideSeen(), marathon.isMixedDays(),
                marathon.getMaxFilmsPerWeek(), marathon.getMaxEpisodesPerDay(), total, total - pendingCount(units),
                items, days, toPlan(media, units, result, seenEpisodes(marathon.getUser(), marathon.isHideSeen()),
                        marathon.getItems().stream().collect(Collectors.toMap(i -> i.getMedia().getId(), Function.identity(), (x, y) -> x))));
    }

    private void validate(MarathonRequest r) {
        if (r.name() == null || r.name().trim().isEmpty() || r.name().trim().length() > 60) bad("Il nome deve avere tra 1 e 60 caratteri");
        if (r.visionOrder() == null || !VISION_ORDERS.contains(r.visionOrder())) bad("Partenza non valida");
        if (r.startDate() == null || r.endDate() == null) bad("Scegli la data di inizio e di fine");
        if (r.endDate().isBefore(r.startDate())) bad("La data di fine deve essere uguale o successiva a quella di inizio");
        if (r.endDate().isBefore(LocalDate.now())) bad("La data di fine è già passata");
        if (r.maxFilmsPerWeek() < 0 || r.maxFilmsPerWeek() > 50) bad("I film a settimana devono essere tra 0 e 50");
        if (r.maxEpisodesPerDay() < 0 || r.maxEpisodesPerDay() > 50) bad("Gli episodi al giorno devono essere tra 0 e 50");
        if (r.mediaIds() == null || r.mediaIds().isEmpty()) bad("Aggiungi almeno un titolo alla maratona");
        String bg = r.background();
        if (bg != null && (bg.length() > MAX_BACKGROUND_LENGTH
                || !(bg.startsWith("data:image/") || bg.startsWith("/") || bg.startsWith("https://")))) {
            bad("Immagine di sfondo non valida o troppo pesante");
        }
    }

    private static void bad(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    // Titoli nell'ordine scelto (quello della Timeline), senza duplicati
    private List<Media> loadMedia(List<Long> ids) {
        List<Long> unique = new ArrayList<>(new LinkedHashSet<>(ids));
        Map<Long, Media> found = mediaRepository.findAllById(unique).stream()
                .collect(Collectors.toMap(Media::getId, Function.identity()));
        if (found.size() != unique.size()) bad("Alcuni titoli non esistono più");
        return unique.stream().map(found::get).toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }

    private Marathon findMarathon(String email, Long id) {
        return marathonRepository.findByIdAndUser(id, findUser(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maratona non trovata"));
    }
}
