import { CLIENT_ERROR_PREFIX } from '@/common/constance';
import sharp, { Sharp } from 'sharp';
import { logTime } from '.';
import { isNumberString } from '@/common/utils';

/**
 * 裁剪图片
 */
function resizeImage(imageHandle: Sharp, args: ResizeImageAction['args']) {
    const { m, w, h, limit = '0' } = args;
    const numW = isNumberString(w) ? Number(w) : undefined;
    const numH = isNumberString(h) ? Number(h) : undefined;
    if (m === 'lfit') {
        if (!numW && !numH) {
            throw new Error(
                `${CLIENT_ERROR_PREFIX} Missing required argument: w or h`,
            );
        }
        return imageHandle.resize(numW, numH, {
            fit: 'outside',
            withoutEnlargement: limit === '1',
        });
    } else if (m === 'mfit') {
        if (!numW && !numH) {
            throw new Error(
                `${CLIENT_ERROR_PREFIX} Missing required argument: w or h`,
            );
        }
        return imageHandle.resize(numW, numH, {
            fit: 'inside',
            withoutEnlargement: limit === '1',
        });
    } else if (m === 'fixed') {
        if (!numW || !numH) {
            throw new Error(
                `${CLIENT_ERROR_PREFIX} Missing required argument: w and h`,
            );
        }
        return imageHandle.resize(numW, numH, {
            fit: 'fill',
            withoutEnlargement: limit === '1',
        });
    } else {
        throw new Error(`${CLIENT_ERROR_PREFIX} Invalid resize mode: ${m}`);
    }
}

export async function imageTransfer(
    imageBuffer: Uint8Array,
    actions: ImageAction[],
) {
    let imageHandle = sharp(imageBuffer);
    const metadata = await logTime(
        () => imageHandle.metadata(),
        'Read image metadata',
    );
    let quality = 0;
    let format = metadata.format;
    for (const action of actions) {
        const { actionName, args } = action;
        if (actionName === 'resize') {
            imageHandle = await logTime(
                () => resizeImage(imageHandle, args),
                'Resize image',
            );
        } else if (actionName === 'quality') {
            quality = Number(args.q);
        } else if (actionName === 'format') {
            const targetFormat = args.f;
            format = targetFormat as keyof sharp.FormatEnum;
        }
    }

    // 如果有 format 或者 quality 操作，就需要重新对图片格式化
    if (
        actions.map((item) => item.actionName).includes('format') ||
        actions.map((item) => item.actionName).includes('quality')
    ) {
        imageHandle = await logTime(
            () =>
                imageHandle.toFormat(format as keyof sharp.FormatEnum, {
                    quality: quality || undefined,
                }),
            'Transform image format and quantity',
        );
    }

    const buffer = await logTime(
        () => imageHandle.toBuffer(),
        'Read image buffer',
    );

    return {
        buffer,
        contentType: `image/${format}`,
    };
}
