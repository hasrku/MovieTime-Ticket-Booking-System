package com.harsku.movietime.controller;

import com.harsku.movietime.dto.MovieDtos.*;
import com.harsku.movietime.service.MovieService;
import com.harsku.movietime.service.ShowBookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final MovieService movieService;
    private final ShowBookingService showBookingService;

    public AdminController(MovieService movieService, ShowBookingService showBookingService) {
        this.movieService = movieService;
        this.showBookingService = showBookingService;
    }

    @PostMapping("/movies")
    public ResponseEntity<MovieDto> createMovie(@Valid @RequestBody CreateMovieRequest req) {
        return ResponseEntity.ok(movieService.createMovie(req));
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<MovieDto> updateMovie(@PathVariable UUID id, @Valid @RequestBody CreateMovieRequest req) {
        return ResponseEntity.ok(movieService.updateMovie(id, req));
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<Map<String, String>> deleteMovie(@PathVariable UUID id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(Map.of("message", "Movie deleted"));
    }

    @PostMapping("/shows")
    public ResponseEntity<ShowDto> createShow(@Valid @RequestBody CreateShowRequest req) {
        return ResponseEntity.ok(showBookingService.createShow(req));
    }

    @PutMapping("/shows/{showId}/tickets")
    public ResponseEntity<ShowDto> updateShowTickets(
            @PathVariable UUID showId,
            @Valid @RequestBody UpdateTicketsRequest req) {
        return ResponseEntity.ok(showBookingService.updateShowTickets(showId, req));
    }

    @DeleteMapping("/shows/{showId}")
    public ResponseEntity<Map<String, String>> deleteShow(@PathVariable UUID showId) {
        showBookingService.deleteShow(showId);
        return ResponseEntity.ok(Map.of("message", "Show deleted"));
    }
}
