interface ResizeImageAction {
    actionName: 'resize';
    args: {
        m: 'lfit' | 'mfit' /** "fill", "pad", "fixed" */;
        w?: string;
        h?: string;
        limit?: '0' | '1';
    };
}

interface QualityImageAction {
    actionName: 'quality';
    args: {
        q: string;
    };
}

interface FormatImageAction {
    actionName: 'format';
    args: {
        f: 'jpg' | 'png' | 'webp' | 'heic' | 'gif' | 'auto';
    };
}

type ImageAction = ResizeImageAction | QualityImageAction | FormatImageAction;

type ImageActionName = ImageAction['actionName'];
