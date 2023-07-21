export const withTaskName = <T>(name: string, fn: T) =>
    Object.assign(fn as any, { displayName: name });

export const excludeFiles = (files: string[]) => {
    const excludes = [
        "node_modules",
        "test",
        "mock",
        "gulpfile",
        "dist",
        "types",
    ];
    return files.filter(
        (path) => !excludes.some((exclude) => path.includes(exclude)),
    );
};
