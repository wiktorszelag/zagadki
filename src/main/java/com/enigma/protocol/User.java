package com.enigma.protocol;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "app_users")
public class User {

    @Id
    private String id;
    
    private String username;
    private String email;
    private String passwordHash;
    private String role; // "ADMIN" or "PLAYER"
    
    private boolean enabled = false;
    private String verificationToken;
    private String resetToken;

    // Progress Tracking
    private int v1Level = 1;
    private int v2Level = 1;
    private long v1TimeMs = 0L;
    private long v2TimeMs = 0L;
    private boolean v1Completed = false;
    private boolean v2Completed = false;

    public User() {}

    public User(String username, String email, String passwordHash, String role) {
        this.id = UUID.randomUUID().toString();
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public int getV1Level() { return v1Level; }
    public void setV1Level(int v1Level) { this.v1Level = v1Level; }
    
    public int getV2Level() { return v2Level; }
    public void setV2Level(int v2Level) { this.v2Level = v2Level; }
    
    public long getV1TimeMs() { return v1TimeMs; }
    public void setV1TimeMs(long v1TimeMs) { this.v1TimeMs = v1TimeMs; }
    
    public long getV2TimeMs() { return v2TimeMs; }
    public void setV2TimeMs(long v2TimeMs) { this.v2TimeMs = v2TimeMs; }
    
    public boolean isV1Completed() { return v1Completed; }
    public void setV1Completed(boolean v1Completed) { this.v1Completed = v1Completed; }
    
    public boolean isV2Completed() { return v2Completed; }
    public void setV2Completed(boolean v2Completed) { this.v2Completed = v2Completed; }
}
