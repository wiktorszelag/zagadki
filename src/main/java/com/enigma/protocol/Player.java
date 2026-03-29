package com.enigma.protocol;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Column;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@Entity
@Table(name = "players")
public class Player {

    @Id
    private String id;
    
    private String nickname;
    private int currentLevel;
    private long startTime;
    private long endTime;
    private boolean completed;
    private long totalTimeMs;
    
    private long lastLevelStartTime;
    
    @ElementCollection
    @CollectionTable(name = "player_level_times", joinColumns = @JoinColumn(name = "player_id"))
    @MapKeyColumn(name = "level")
    @Column(name = "time_ms")
    private Map<Integer, Long> levelTimes = new HashMap<>();

    public Player() {}

    public Player(String nickname) {
        this.id = UUID.randomUUID().toString();
        this.nickname = nickname;
        this.currentLevel = 0;
        this.startTime = System.currentTimeMillis();
        this.lastLevelStartTime = this.startTime;
        this.completed = false;
        this.totalTimeMs = 0;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public int getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(int currentLevel) { this.currentLevel = currentLevel; }
    public long getStartTime() { return startTime; }
    public void setStartTime(long startTime) { this.startTime = startTime; }
    public long getEndTime() { return endTime; }
    public void setEndTime(long endTime) { this.endTime = endTime; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public long getTotalTimeMs() { return totalTimeMs; }
    public void setTotalTimeMs(long totalTimeMs) { this.totalTimeMs = totalTimeMs; }
    public long getLastLevelStartTime() { return lastLevelStartTime; }
    public void setLastLevelStartTime(long lastLevelStartTime) { this.lastLevelStartTime = lastLevelStartTime; }
    public Map<Integer, Long> getLevelTimes() { return levelTimes; }
    public void setLevelTimes(Map<Integer, Long> levelTimes) { this.levelTimes = levelTimes; }
}
