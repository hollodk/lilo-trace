export class LiloOptic {
    combinePrisms(prism1, base1, prism2, base2) {
        // Convert angles to radians
        const rad1 = base1 * (Math.PI / 180);
        const rad2 = base2 * (Math.PI / 180);

        // Decompose into horizontal and vertical components
        const x1 = prism1 * Math.cos(rad1);
        const y1 = prism1 * Math.sin(rad1);

        const x2 = prism2 * Math.cos(rad2);
        const y2 = prism2 * Math.sin(rad2);

        // Combine components
        const x = x1 + x2;
        const y = y1 + y2;

        // Resultant prism
        const resultantPrism = Math.sqrt(x * x + y * y);
        let resultantAngle = Math.atan2(y, x) * (180 / Math.PI);

        // Normalize angle to 0–360°
        if (resultantAngle < 0) {
            resultantAngle += 360;
        }

        return {
            prism: parseFloat(resultantPrism.toFixed(2)),
            base: parseFloat(resultantAngle.toFixed(1))
        };
    }

    baseDirectionConverter(input, eye = 'OD') {
        const normalizedEye = eye.toUpperCase();

        const directionsOD = {
            'base in': 0,
            'bi': 0,
            'base out': 180,
            'bo': 180,
            'base up': 90,
            'bu': 90,
            'base down': 270,
            'bd': 270,
        };

        const directionsOS = {
            'base in': 180,
            'bi': 180,
            'base out': 0,
            'bo': 0,
            'base up': 90,
            'bu': 90,
            'base down': 270,
            'bd': 270,
        };

        const dirMap = normalizedEye === 'OD' ? directionsOD : directionsOS;

        if (typeof input === 'string') {
            const key = input.trim().toLowerCase();
            if (key in dirMap) {
                return dirMap[key];
            } else {
                throw new Error(`Unknown base direction: "${input}"`);
            }
        }

        if (typeof input === 'number') {
            let angle = input % 360;
            if (angle < 0) angle += 360;

            // Approximate named direction from angle
            const threshold = 20; // degrees tolerance
            const matches = Object.entries(dirMap).filter(([k, v]) => Math.abs(v - angle) <= threshold);
            if (matches.length) {
                return matches[0][0]; // e.g. 'base in'
            }

            return `${angle.toFixed(1)}° (no standard label for ${eye})`;
        }

        throw new Error('Input must be a string (named direction) or number (angle).');
    }

    parsePrismString(input, eye = 'OD') {
        if (typeof input !== 'string') {
            throw new Error('Input must be a string like "2BU" or "2 base up"');
        }

        // Normalize spacing and lowercase
        const normalized = input.toLowerCase().replace(/([a-z]+)/g, ' $1').trim();

        // Match number and base direction
        const match = normalized.match(/^([0-9.]+)\s*(base\s+in|base\s+out|base\s+up|base\s+down|bi|bo|bu|bd)$/i);

        if (!match) {
            throw new Error(`Cannot parse prism string: "${input}"`);
        }

        const prism = parseFloat(match[1]);
        const baseLabel = match[2].trim();

        const base = this.baseDirectionConverter(baseLabel, eye);

        return {
            prism,
            base,
        };
    }
}

if (typeof window !== 'undefined') {
    window.LiloOptic = LiloOptic; // for CDN/global use
}
