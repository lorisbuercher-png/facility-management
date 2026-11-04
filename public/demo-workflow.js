// Generated from app/workflow.ts. Run node scripts/demo-workflow.cjs.
(()=>{const exports={};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectiveStatus = effectiveStatus;
exports.applyWorkflow = applyWorkflow;
exports.protectSnapshot = protectSnapshot;
function effectiveStatus(t) { return ['Offen', 'Geplant', 'In Arbeit'].includes(t.status) ? 'Gemeldet' : t.status; }
const text = (v, max, required = false) => typeof v === 'string' && v.length <= max && (!required || !!v.trim());
function applyWorkflow(state, input, user, now, id) {
    const fail = (error, status = 400) => ({ error, status });
    if (!input || typeof input !== 'object' || typeof input.companyId !== 'string' || !['create', 'edit', 'approve', 'reject', 'schedule', 'complete'].includes(input.action))
        return fail('Ungültige Aktion.');
    const c = state?.companies?.find((c) => c.id === input.companyId), w = state?.workspaces?.[input.companyId];
    if (!c || !w)
        return fail('Unternehmen nicht gefunden.', 404);
    if (user.role !== 'superadmin' && user.role !== 'employee' && user.companyId !== c.id)
        return fail('Kein Zugriff auf dieses Unternehmen.', 403);
    if (!c.modules.includes('Mängel & Aufträge'))
        return fail('Das Auftragsmodul ist deaktiviert.', 403);
    const locationId = input.action === 'create' ? input.locationId : w.tasks.find((t) => t.id === input.taskId)?.locationId;
    if (!w.locations.some((l) => l.id === locationId))
        return fail('Standort nicht gefunden.', 404);
    if (user.role === 'branch' && user.locationId !== locationId)
        return fail('Kein Zugriff auf diese Filiale.', 403);
    const t = input.action === 'create' ? null : w.tasks.find((t) => t.id === input.taskId);
    if (input.action !== 'create' && !t)
        return fail('Auftrag nicht gefunden.', 404);
    if (t && (!Number.isSafeInteger(input.taskRevision) || input.taskRevision !== (t.workflowRevision || 0)))
        return fail('Der Auftrag wurde inzwischen geändert. Bitte Daten aktualisieren.', 409);
    if (t && user.role === 'employee' && effectiveStatus(t) !== 'Freigegeben')
        return fail('Kein Zugriff auf diesen Auftrag.', 403);
    if (t && (t.history?.length || 0) >= 2000)
        return fail('Maximale Anzahl Verlaufseinträge erreicht.', 409);
    let target = t, actionLabel = '', note = '';
    if (input.action === 'create' || input.action === 'edit') {
        if (user.role === 'employee' || user.role === 'manager')
            return fail('Manager und Mitarbeiter können keine Mängel anlegen oder Stammdaten ändern.', 403);
        if (input.action === 'edit' && user.role === 'branch' && (effectiveStatus(t) !== 'Gemeldet' || t.createdById !== user.id))
            return fail('Nur eigene, noch nicht freigegebene Meldungen können geändert werden.', 403);
        if (!text(input.title, 150, true) || !text(input.description, 5000, true) || !['Niedrig', 'Normal', 'Dringend'].includes(input.priority) || !text(input.due, 10) || !text(input.assignee, 100) || input.due && (!/^\d{4}-\d{2}-\d{2}$/.test(input.due) || Number.isNaN(Date.parse(input.due))))
            return fail('Bitte Titel, Beschreibung, Priorität und Termin prüfen.');
        if (input.action === 'create') {
            if (w.tasks.length >= 20000)
                return fail('Maximale Anzahl Aufträge erreicht.', 409);
            target = { id, title: input.title.trim(), description: input.description.trim(), priority: input.priority, locationId, status: 'Gemeldet', due: input.due, assignee: input.assignee.trim(), createdAt: now, createdById: user.id, updatedAt: now, workflowRevision: 1, history: [] };
            w.tasks.unshift(target);
            actionLabel = 'Mangel gemeldet';
        }
        else {
            Object.assign(target, { title: input.title.trim(), description: input.description.trim(), priority: input.priority, due: input.due, assignee: input.assignee.trim() });
            actionLabel = 'Auftrag bearbeitet';
        }
    }
    else if (input.action === 'approve' || input.action === 'reject') {
        if (user.role !== 'manager')
            return fail('Nur der zuständige Manager darf freigeben oder ablehnen.', 403);
        if (effectiveStatus(t) !== 'Gemeldet')
            return fail('Nur gemeldete Mängel können geprüft werden.', 409);
        if (!text(input.note ?? '', 2000, input.action === 'reject'))
            return fail('Bitte eine Begründung für die Ablehnung eingeben.');
        note = (input.note || '').trim();
        actionLabel = input.action === 'approve' ? 'Mangel freigegeben' : 'Mangel abgelehnt';
    }
    else if (input.action === 'schedule') {
        if (user.role !== 'manager')
            return fail('Nur der zuständige Manager darf Termine freigeben.', 403);
        if (effectiveStatus(t) !== 'Freigegeben')
            return fail('Termine können nur für freigegebene Arbeiten bestätigt werden.', 409);
        if (!text(input.due, 10, true) || !/^\d{4}-\d{2}-\d{2}$/.test(input.due) || Number.isNaN(Date.parse(input.due)) || new Date(input.due + 'T12:00:00Z').toISOString().slice(0, 10) !== input.due)
            return fail('Bitte ein gültiges Termindatum wählen.');
        if (input.startTime !== undefined && input.startTime !== '' && (typeof input.startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime)))
            return fail('Bitte eine gültige Startzeit eingeben.');
        const minutes = input.durationMinutes === '' || input.durationMinutes === undefined ? null : Number(input.durationMinutes);
        if (minutes !== null && (!Number.isInteger(minutes) || minutes < 15 || minutes > 720))
            return fail('Geplante Dauer: 15 bis 720 Minuten.');
        if (!text(input.note ?? '', 2000))
            return fail('Bitte die Terminnotiz prüfen.');
        note = [input.due, input.startTime || '', (input.note || '').trim()].filter(Boolean).join(' · ');
        target.due = input.due;
        target.startTime = input.startTime || '';
        target.durationMinutes = minutes;
        target.scheduleApproval = { date: input.due, startTime: target.startTime, durationMinutes: minutes, at: now, userId: user.id, userName: user.name };
        actionLabel = 'Termin freigegeben';
    }
    else {
        if (user.role !== 'employee')
            return fail('Nur Mitarbeiter dürfen freigegebene Arbeiten abschliessen.', 403);
        if (effectiveStatus(t) !== 'Freigegeben')
            return fail('Nur freigegebene Arbeiten können abgeschlossen werden.', 409);
        if (!text(input.reportText, 5000, true) || typeof input.hours !== 'number' || !Number.isFinite(input.hours) || input.hours <= 0 || input.hours > 1000 || Math.abs(Math.round(input.hours * 100) - input.hours * 100) > .00001)
            return fail('Bitte Rapporttext und gültige Stunden (maximal zwei Dezimalstellen) eingeben.');
        target.report = { text: input.reportText.trim(), hours: input.hours, userId: user.id, userName: user.name, at: now };
        actionLabel = 'Arbeit erledigt';
    }
    const from = t ? effectiveStatus(t) : null;
    target.history = Array.isArray(target.history) ? target.history : [];
    if (input.action !== 'create') {
        target.workflowRevision = (target.workflowRevision || 0) + 1;
        target.updatedAt = now;
    }
    if (input.action === 'approve')
        target.status = 'Freigegeben';
    if (input.action === 'reject')
        target.status = 'Abgelehnt';
    if (input.action === 'complete')
        target.status = 'Erledigt';
    target.history.push({ id, action: actionLabel, from, to: effectiveStatus(target), userId: user.id, userName: user.name, userRole: user.role, at: now, note });
    return { taskId: target.id };
}
function protectSnapshot(previous, incoming, user, now) {
    if (!incoming || !Array.isArray(incoming.companies) || !incoming.workspaces || typeof incoming.workspaces !== 'object')
        return 'Ungültige Datensätze.';
    if (previous) {
        for (const [cid, w] of Object.entries(previous.workspaces || {})) {
            if (w.tasks?.length && (!incoming.companies.some((c) => c.id === cid) || !incoming.workspaces[cid]))
                return 'Unternehmen mit Aufträgen können hier nicht entfernt werden.';
        }
        for (const [cid, w] of Object.entries(incoming.workspaces)) {
            if (JSON.stringify(w.tasks || []) !== JSON.stringify(previous.workspaces?.[cid]?.tasks || []))
                return 'Aufträge dürfen nur über die Auftragsfunktionen geändert werden.';
        }
    }
    else {
        for (const w of Object.values(incoming.workspaces)) {
            if (!Array.isArray(w.tasks))
                return 'Ungültige Aufträge.';
            w.tasks = w.tasks.map((t) => ({ ...t, status: 'Gemeldet', createdById: user.id, workflowRevision: 1, photos: undefined, report: undefined, history: [{ id: 'import-' + t.id, action: 'Bestandsauftrag zur Prüfung importiert', from: null, to: 'Gemeldet', userId: user.id, userName: user.name, userRole: user.role, at: now, note: 'Bisheriger Status: ' + String(t.status) }] }));
        }
    }
    return null;
}

window.FACILITY_DEMO_WORKFLOW=exports.applyWorkflow;})();
