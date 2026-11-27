package com.harsku.movietime.controller;

import com.harsku.movietime.dto.MovieDtos.*;
import com.harsku.movietime.service.ShowBookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shows")
public class ShowController {

    private final ShowBookingService showBookingService;

    public ShowController(ShowBookingService showBookingService) {
        this.showBookingService = showBookingService;
    }

    @GetMapping
    public ResponseEntity<List<ShowDto>> getAllShows() {
        return ResponseEntity.ok(showBookingService.getAllShows());
    }

    @GetMapping("/{showId}")
    public ResponseEntity<ShowDto> getShow(@PathVariable UUID showId) {
        return ResponseEntity.ok(showBookingService.getShow(showId));
    }

    @PostMapping("/{showId}/seats/lock")
    public ResponseEntity<ShowDto> lockSeats(
            @PathVariable UUID showId,
            Authentication authentication,
            @Valid @RequestBody SeatActionRequest req) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(showBookingService.lockSeats(showId, userId, req.seatNumbers()));
    }

    @PostMapping("/{showId}/seats/unlock")
    public ResponseEntity<ShowDto> unlockSeats(
            @PathVariable UUID showId,
            Authentication authentication,
            @Valid @RequestBody SeatActionRequest req) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(showBookingService.unlockSeats(showId, userId, req.seatNumbers()));
    }

    @PostMapping("/{showId}/book")
    public ResponseEntity<BookingDto> confirmBooking(
            @PathVariable UUID showId,
            Authentication authentication,
            @Valid @RequestBody SeatActionRequest req) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(showBookingService.confirmBooking(showId, userId, req.seatNumbers()));
    }
}
