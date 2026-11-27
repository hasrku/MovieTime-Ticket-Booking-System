package com.harsku.movietime.entity;

import java.math.BigDecimal;
import java.util.UUID;

public class SeatTicket {
    private String seatNumber;
    private String row;
    private int number;
    private String type; // STANDARD, VIP
    private BigDecimal price;
    private String status; // AVAILABLE, LOCKED, BOOKED
    private UUID lockedBy;
    private String lockedUntil;
    private UUID bookedBy;

    public SeatTicket() {}

    public SeatTicket(String seatNumber, String row, int number, String type, BigDecimal price, String status) {
        this.seatNumber = seatNumber;
        this.row = row;
        this.number = number;
        this.type = type;
        this.price = price;
        this.status = status;
    }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public String getRow() { return row; }
    public void setRow(String row) { this.row = row; }

    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getLockedBy() { return lockedBy; }
    public void setLockedBy(UUID lockedBy) { this.lockedBy = lockedBy; }

    public String getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(String lockedUntil) { this.lockedUntil = lockedUntil; }

    public UUID getBookedBy() { return bookedBy; }
    public void setBookedBy(UUID bookedBy) { this.bookedBy = bookedBy; }
}
