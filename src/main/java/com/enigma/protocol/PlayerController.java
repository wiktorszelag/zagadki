package com.enigma.protocol;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    @Autowired
    private PlayerRepository repository;

    @PostMapping
    public Player registerPlayer(@RequestBody Map<String, String> body) {
        String nick = body.get("nickname");
        if(nick == null || nick.trim().isEmpty()) nick = "Anonim";
        
        Player p = new Player(nick);
        return repository.save(p);
    }

    @PutMapping("/{id}/level/{level}")
    public Player updateLevel(@PathVariable String id, @PathVariable int level) {
        Player p = repository.findById(id).orElse(null);
        if (p != null && !p.getCompleted()) {
            long now = System.currentTimeMillis();
            long actualNow = p.getTimeStopped() ? p.getTimeStoppedAt() : now;
            long timeTaken = actualNow - p.getLastLevelStartTime();
            int previousLevel = p.getCurrentLevel();
            if (previousLevel > 0) {
                p.getLevelTimes().put(previousLevel, timeTaken);
            }
            p.setLastLevelStartTime(actualNow);
            p.setCurrentLevel(level);
            return repository.save(p);
        }
        return p;
    }

    @PutMapping("/{id}/finish")
    public Player finish(@PathVariable String id) {
        Player p = repository.findById(id).orElse(null);
        if (p != null && !p.getCompleted()) {
            long now = System.currentTimeMillis();
            long actualNow = p.getTimeStopped() ? p.getTimeStoppedAt() : now;
            long timeTaken = actualNow - p.getLastLevelStartTime();
            int previousLevel = p.getCurrentLevel();
            if (previousLevel > 0) {
                p.getLevelTimes().put(previousLevel, timeTaken);
            }
            
            p.setCompleted(true);
            p.setEndTime(now);
            p.setTotalTimeMs(actualNow - p.getStartTime());
            p.setCurrentLevel(12); // Powyżej 11 oznacza wygrana
            return repository.save(p);
        }
        return p;
    }

    @PutMapping("/{id}/time/stop")
    public Player stopTime(@PathVariable String id) {
        Player p = repository.findById(id).orElse(null);
        if (p != null && !p.getCompleted() && !p.getTimeStopped()) {
            p.setTimeStopped(true);
            p.setTimeStoppedAt(System.currentTimeMillis());
            return repository.save(p);
        }
        return p;
    }

    @PutMapping("/{id}/time/resume")
    public Player resumeTime(@PathVariable String id) {
        Player p = repository.findById(id).orElse(null);
        if (p != null && !p.getCompleted() && p.getTimeStopped()) {
            long now = System.currentTimeMillis();
            long pausedDuration = now - p.getTimeStoppedAt();
            p.setStartTime(p.getStartTime() + pausedDuration);
            p.setLastLevelStartTime(p.getLastLevelStartTime() + pausedDuration);
            p.setTimeStopped(false);
            p.setTimeStoppedAt(0L);
            return repository.save(p);
        }
        return p;
    }

    @PutMapping("/{id}/time/set")
    public Player setTime(@PathVariable String id, @RequestBody Map<String, Long> body) {
        Player p = repository.findById(id).orElse(null);
        if (p != null && !p.getCompleted()) {
            Long newTimeMs = body.get("timeMs");
            if (newTimeMs != null) {
                long now = System.currentTimeMillis();
                if (p.getTimeStopped()) {
                     p.setStartTime(p.getTimeStoppedAt() - newTimeMs);
                } else {
                     long diff = (now - p.getStartTime()) - newTimeMs;
                     p.setStartTime(p.getStartTime() + diff);
                     p.setLastLevelStartTime(p.getLastLevelStartTime() + diff);
                }
                return repository.save(p);
            }
        }
        return p;
    }

    @PutMapping("/{id}/level-time/{level}")
    public Player setLevelTime(@PathVariable String id, @PathVariable int level, @RequestBody Map<String, Long> body) {
        Player p = repository.findById(id).orElse(null);
        if (p != null) {
            Long newTimeMs = body.get("timeMs");
            if (newTimeMs != null) {
                if (p.getLevelTimes().containsKey(level)) {
                    Long oldTimeMs = p.getLevelTimes().get(level);
                    long diff = newTimeMs - oldTimeMs;
                    p.getLevelTimes().put(level, newTimeMs);
                    p.setStartTime(p.getStartTime() - diff);
                    if (p.getCompleted()) {
                        p.setTotalTimeMs(p.getTotalTimeMs() + diff);
                    }
                    return repository.save(p);
                } else if (!p.getCompleted() && p.getCurrentLevel() == level) {
                    long now = System.currentTimeMillis();
                    long actualNow = p.getTimeStopped() ? p.getTimeStoppedAt() : now;
                    long oldTimeMs = actualNow - p.getLastLevelStartTime();
                    long diff = newTimeMs - oldTimeMs;
                    p.setLastLevelStartTime(p.getLastLevelStartTime() - diff);
                    p.setStartTime(p.getStartTime() - diff);
                    return repository.save(p);
                }
            }
        }
        return p;
    }

    @GetMapping
    public List<Player> getAllPlayers() {
        return repository.findAllByOrderByStartTimeDesc();
    }

    @GetMapping("/leaderboard")
    public List<Player> getLeaderboard() {
        return repository.findByCompletedTrueOrderByTotalTimeMsAsc();
    }

    @DeleteMapping("/{id}")
    public void deletePlayer(@PathVariable String id) {
        if(repository.existsById(id)) {
            repository.deleteById(id);
        }
    }
}
