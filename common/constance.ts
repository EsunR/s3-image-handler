export const IMAGE_OPERATION_SPLIT = "__op__";

export const IMAGE_OPERATION_SORT = [
    {
        op: "resize",
        args: ["m", "w", "h", "limit"],
    },
    {
        op: "quality",
        args: ["q"],
    },
    {
        op: "format",
        args: ["f"],
    },
];