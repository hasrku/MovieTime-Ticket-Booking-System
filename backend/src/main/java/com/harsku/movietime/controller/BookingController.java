package com.harsku.movietime.controller;

import com.harsku.movietime.dto.MovieDtos.BookingDto;
import com.harsku.movietime.service.ShowBookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final ShowBookingService showBookingService;

    public BookingController(ShowBookingService showBookingService) {
        this.showBookingService = showBookingService;
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDto>> getMyBookings(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(showBookingService.getUserBookings(userId));
    }
}
