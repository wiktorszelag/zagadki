package com.enigma.protocol;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
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
    private Long startTime = 0L;
    private Long endTime = 0L;
    private Boolean completed = false;
    private Long totalTimeMs = 0L;
    
    private Boolean timeStopped = false;
    private Long timeStoppedAt = 0L;
    
    private Long lastLevelStartTime = 0L;
    
    @ElementCollection(fetch = FetchType.EAGER)
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
        this.totalTimeMs = 0L;
        this.endTime = 0L;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public int getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(int currentLevel) { this.currentLevel = currentLevel; }
    public long getStartTime() { return startTime != null ? startTime : 0L; }
    public void setStartTime(Long startTime) { this.startTime = startTime; }
    public long getEndTime() { return endTime != null ? endTime : 0L; }
    public void setEndTime(Long endTime) { this.endTime = endTime; }
    public Boolean getCompleted() { return completed != null ? completed : false; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
    public long getTotalTimeMs() { return totalTimeMs != null ? totalTimeMs : 0L; }
    public void setTotalTimeMs(Long totalTimeMs) { this.totalTimeMs = totalTimeMs; }
    public long getLastLevelStartTime() { return lastLevelStartTime != null ? lastLevelStartTime : 0L; }
    public void setLastLevelStartTime(Long lastLevelStartTime) { this.lastLevelStartTime = lastLevelStartTime; }
    public Map<Integer, Long> getLevelTimes() { return levelTimes; }
    public void setLevelTimes(Map<Integer, Long> levelTimes) { this.levelTimes = levelTimes; }
    public Boolean getTimeStopped() { return timeStopped != null ? timeStopped : false; }
    public void setTimeStopped(Boolean timeStopped) { this.timeStopped = timeStopped; }
    public long getTimeStoppedAt() { return timeStoppedAt != null ? timeStoppedAt : 0L; }
    public void setTimeStoppedAt(Long timeStoppedAt) { this.timeStoppedAt = timeStoppedAt; }
}
