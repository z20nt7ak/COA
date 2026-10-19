package org.example.bars.controller;

import jakarta.validation.constraints.Positive;
import org.example.bars.service.BarsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/discipline/{disciplineId}/labwork/{labWorkId}")
public class BarsController {
    private final BarsService barsService;

    @Autowired
    public BarsController(BarsService barsService) {
        this.barsService = barsService;
    }

    @PostMapping("/add")
    public ResponseEntity<Void> add(@PathVariable("disciplineId") @Positive long disciplineId,
                                    @PathVariable("labWorkId") @Positive long labWorkId) {
        barsService.addLabWork(disciplineId, labWorkId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/remove")
    public ResponseEntity<Void> remove(@PathVariable("disciplineId") @Positive long disciplineId,
                                       @PathVariable("labWorkId") @Positive long labWorkId) {
        barsService.removeLabWork(disciplineId, labWorkId);
        return ResponseEntity.ok().build();
    }
}