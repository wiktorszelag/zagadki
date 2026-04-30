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
    private Integer v1Level = 1;
    private Integer v2Level = 1;
    private Long v1TimeMs = 0L;
    private Long v2TimeMs = 0L;
    private Boolean v1Completed = false;
    private Boolean v2Completed = false;
    private Integer leaveCount = 0; // Licznik opuszczeń sesji

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

    public int getV1Level() { return v1Level != null ? v1Level : 1; }
    public void setV1Level(Integer v1Level) { this.v1Level = v1Level; }
    
    public int getV2Level() { return v2Level != null ? v2Level : 1; }
    public void setV2Level(Integer v2Level) { this.v2Level = v2Level; }
    
    public long getV1TimeMs() { return v1TimeMs != null ? v1TimeMs : 0L; }
    public void setV1TimeMs(Long v1TimeMs) { this.v1TimeMs = v1TimeMs; }
    
    public long getV2TimeMs() { return v2TimeMs != null ? v2TimeMs : 0L; }
    public void setV2TimeMs(Long v2TimeMs) { this.v2TimeMs = v2TimeMs; }
    
    public boolean isV1Completed() { return v1Completed != null ? v1Completed : false; }
    public void setV1Completed(Boolean v1Completed) { this.v1Completed = v1Completed; }
    
    public boolean isV2Completed() { return v2Completed != null ? v2Completed : false; }
    public void setV2Completed(Boolean v2Completed) { this.v2Completed = v2Completed; }

    public int getLeaveCount() { return leaveCount != null ? leaveCount : 0; }
    public void setLeaveCount(Integer leaveCount) { this.leaveCount = leaveCount; }
}
