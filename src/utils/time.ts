export function formatTimeHHMM(time?: string | null) {
    if (!time) return '';
    // Match HH:MM or HH:MM:SS (allow 1-2 digits hour)
    const m = String(time).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return String(time);
    const hh = m[1].padStart(2, '0');
    const mm = m[2];
    return `${hh}:${mm}`;
}

export default formatTimeHHMM;
