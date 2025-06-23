/**
 * 获取TTML格式歌词(AMLL歌词专属)
 * @param {number} id - 要获取歌词的音乐ID
 */
export const getSongTTML = async (id) => {
    if (1 === 2 && import.meta.env["RENDERER_VITE_SITE_ROOT"] === "true") {
        var lyricurl = "/api/ttml";
    } else {
        var lyricurl = `${import.meta.env.VITE_TTML_API}`;
    }
    if (import.meta.env["VITE_TTML_API"] === '') {
        return null;
    }
    const url = `${lyricurl}/api/search?id=${id}&fixedVersion=ttml`;
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorMessage = `TTML API请求失败或TTML仓库没有歌词: ${response.status} ${response.statusText}`;
            console.error(errorMessage);
            console.log("将会使用默认歌词");
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching TTML:", error);
        return null;
    }
}