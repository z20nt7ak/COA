package org.example.bars.controller;

import org.example.bars.service.BarsService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public void add(@PathVariable("disciplineId") Long disciplineId, @PathVariable("labWorkId") Long labWorkId) {
        barsService.addLabWork(disciplineId, labWorkId);
    }

    @PostMapping("/remove")
    public void remove(@PathVariable("disciplineId") Long disciplineId, @PathVariable("labWorkId") Long labWorkId) {
        barsService.removeLabWork(disciplineId, labWorkId);
    }
}