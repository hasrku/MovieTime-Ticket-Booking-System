package com.harsku.movietime.dto;

import com.harsku.movietime.entity.SeatTicket;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class MovieDtos {

    public record MovieDto(
            UUID id,
            String name,
            String slug,
            String description,
            String imageUrl,
            String adultRating,
            List<String> genres,
            Integer durationMinutes,
            LocalDate releaseDate,
            Double averageRating,
            int reviewCount,
            OffsetDateTime createdAt
    ) {}

    public record MovieDetailDto(
            MovieDto movie,
            List<ShowDto> shows,
            List<ReviewDto> reviews
    ) {}

    public record CreateMovieRequest(
            @NotBlank String name,
            String description,
            String imageUrl,
            String adultRating,
            List<String> genres,
            Integer durationMinutes,
            LocalDate releaseDate
    ) {}

    public record ShowDto(
            UUID id,
            UUID movieId,
            String movieName,
            String movieSlug,
            String screenName,
            OffsetDateTime showTime,
            BigDecimal ticketPrice,
            List<SeatTicket> tickets,
            long availableCount
    ) {}

    public record CreateShowRequest(
            @NotNull UUID movieId,
            @NotBlank String screenName,
            @NotNull OffsetDateTime showTime,
            @NotNull @DecimalMin("1.00") BigDecimal ticketPrice,
            Integer rows,
            Integer seatsPerRow
    ) {}

    public record UpdateTicketsRequest(
            @NotNull List<SeatTicket> tickets
    ) {}

    public record SeatActionRequest(
            @NotEmpty List<String> seatNumbers
    ) {}

    public record ReviewDto(
            UUID id,
            UUID userId,
            String userName,
            UUID movieId,
            String review,
            Integer rating,
            OffsetDateTime createdAt
    ) {}

    public record CreateReviewRequest(
            @NotBlank String review,
            @NotNull @Min(1) @Max(10) Integer rating
    ) {}

    public record BookingDto(
            UUID id,
            UUID showId,
            String movieName,
            String movieSlug,
            String movieImageUrl,
            String screenName,
            OffsetDateTime showTime,
            List<String> seats,
            BigDecimal totalAmount,
            String status,
            OffsetDateTime createdAt
    ) {}
}
