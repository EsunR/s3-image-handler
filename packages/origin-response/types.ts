export interface ResizeImageAction {
    actionName: "resize";
    args: {
        m: "lfit" | "mfit" /** "fill", "pad", "fixed" */;
        w?: string;
        h?: string;
        limit?: "0" | "1";
    };
}

export interface QualityImageAction {
    actionName: "quality";
    args: {
        q: string;
    };
}

export interface FormatImageAction {
    actionName: "format";
    args: {
        f: "jpg" | "png" | "webp" | "heic" | "gif" | "auto";
    };
}

export type ImageAction =
    | ResizeImageAction
    | QualityImageAction
    | FormatImageAction;

export type ImageActionName = ImageAction["actionName"];
