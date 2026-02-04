/**
 * Formats a long ID into a short, readable version.
 * Example: 'stp_inob352ftgzur88z49' -> '#inob352f'
 * Example: 'action_123456789' -> '#12345678'
 */
export const formatId = (id: string | undefined | null): string => {
    if (!id) return '';

    // Remove prefix if exists (parts before the first underscore)
    // EXCEPT if the prefix is 'pending' or 'temp' - we might want to keep some indicator
    const parts = id.split('_');
    let actualId = id;

    if (parts.length > 1) {
        // If it's a UUID-like or prefixed string, take the second part
        // Unless the first part is 'pending'
        if (parts[0] === 'pending' || parts[0] === 'temp') {
            return `#${parts[0]}`;
        }
        actualId = parts[1];
    }

    return `#${actualId.substring(0, 8)}`;
};
