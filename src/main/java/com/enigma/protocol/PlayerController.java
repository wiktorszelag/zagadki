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
        if (p != null && !p.isCompleted()) {
            p.setCurrentLevel(level);
            return repository.save(p);
        }
        return p;
    }

    @PutMapping("/{id}/finish")
    public Player finish(@PathVariable String id) {
        Player p = repository.findById(id).orElse(null);
        if (p != null && !p.isCompleted()) {
            p.setCompleted(true);
            p.setEndTime(System.currentTimeMillis());
            p.setTotalTimeMs(p.getEndTime() - p.getStartTime());
            p.setCurrentLevel(12); // Above 11
            return repository.save(p);
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
}
