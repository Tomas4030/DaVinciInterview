export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	if (!BASE_PATH) {
		return normalizedPath;
	}

	return `${BASE_PATH}${normalizedPath}`;
}