export default async function handler(req, res) {
    // Chỉ cho phép gửi dữ liệu lên bằng phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vercel sẽ tự động lấy Token ẩn bạn cài trên web, không ai xem trộm được
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 

    const { textData, githubUser, githubRepo, githubFile } = req.body;

    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: 'Chưa cấu hình GITHUB_TOKEN trên Vercel!' });
    }

    const url = `https://api.github.com/repos/${githubUser}/${githubRepo}/contents/${githubFile}`;
    
    try {
        // 1. Lấy mã SHA của file cũ trên GitHub
        const getFile = await fetch(url, { 
            headers: { "Authorization": `Bearer ${GITHUB_TOKEN}` } 
        });
        const fileData = await getFile.json();
        const sha = fileData.sha;
        
        // 2. Mã hóa chuỗi Key sang Base64 theo chuẩn GitHub
        const base64Content = Buffer.from(textData).toString('base64');

        // 3. Tiến hành đẩy Key lên file GitHub
        const updateFile = await fetch(url, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${GITHUB_TOKEN}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
                message: "Cập nhật Key tự động từ Web", 
                content: base64Content, 
                sha: sha 
            })
        });

        if (updateFile.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errText = await updateFile.text();
            return res.status(500).json({ error: 'Lỗi GitHub API', details: errText });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
              }

