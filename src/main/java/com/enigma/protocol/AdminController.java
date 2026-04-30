package com.enigma.protocol;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        Optional<User> uOpt = userRepository.findById(id);
        if (uOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        // Prevent deleting the main admin
        if ("admin".equals(uOpt.get().getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nie można usunąć głównego konta administratora."));
        }

        userRepository.delete(uOpt.get());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/users/{id}/modify-time")
    public ResponseEntity<?> modifyUserTime(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Optional<User> uOpt = userRepository.findById(id);
        if (uOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = uOpt.get();

        String protocol = (String) body.get("protocol");
        Number deltaMsObj = (Number) body.get("deltaMs");
        long deltaMs = deltaMsObj != null ? deltaMsObj.longValue() : 0L;

        if ("v1".equalsIgnoreCase(protocol)) {
            long newTime = Math.max(0, u.getV1TimeMs() + deltaMs);
            u.setV1TimeMs(newTime);
        } else if ("v2".equalsIgnoreCase(protocol)) {
            long newTime = Math.max(0, u.getV2TimeMs() + deltaMs);
            u.setV2TimeMs(newTime);
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid protocol"));
        }

        userRepository.save(u);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/users/{id}/reset-progress")
    public ResponseEntity<?> resetProgress(@PathVariable String id) {
        Optional<User> uOpt = userRepository.findById(id);
        if (uOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = uOpt.get();

        u.setV1Level(1);
        u.setV2Level(1);
        u.setV1TimeMs(0L);
        u.setV2TimeMs(0L);
        u.setV1Completed(false);
        u.setV2Completed(false);
        u.setV1LevelTimesJson("{}");
        u.setV2LevelTimesJson("{}");
        u.setV1LevelStartedAt(0L);
        u.setV2LevelStartedAt(0L);
        u.setLeaveCount(0);
        u.setPaused(false);

        userRepository.save(u);
        return ResponseEntity.ok(Map.of("success", true, "message", "Postęp gracza zresetowany."));
    }

    @PostMapping("/users/{id}/pause")
    public ResponseEntity<?> pauseUser(@PathVariable String id) {
        Optional<User> uOpt = userRepository.findById(id);
        if (uOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = uOpt.get();
        u.setPaused(true);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/users/{id}/resume")
    public ResponseEntity<?> resumeUser(@PathVariable String id) {
        Optional<User> uOpt = userRepository.findById(id);
        if (uOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = uOpt.get();
        u.setPaused(false);
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
