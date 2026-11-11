package org.example.labs.service;

import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

final class CommitLog {
    private CommitLog() {}

    static void record(String action, long id, Long disciplineId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                LoggerFactory.getLogger(CommitLog.class).info(
                        "action={} id={} disciplineId={} committed=true", action, id, disciplineId);
            }
        });
    }
}
