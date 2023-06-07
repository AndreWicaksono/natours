export const optimizeImage = (
    urlImage: string | undefined,
    options?: {
        convert?: {
            from: string;
            to: string;
        };
        cropMode?: "c_crop" | "c_fill";
        size?: { height?: number; width?: number };
    }
): string | null => {
    if (!urlImage) return null;

    const urlImageSplitted: string[] = urlImage.split("upload");
    const dimensionImage = `${options?.cropMode + "," ?? ""}${options?.size?.height ? `h_${options?.size?.height}` : ""
        },${options?.size?.width ? `w_${options?.size?.width}` : ""},`;

    const result = `${urlImageSplitted[0]}upload/${dimensionImage}${urlImageSplitted[1]}`;

    if (options?.convert)
        return result.replace(options.convert.from, options.convert.to);

    return result;
};
