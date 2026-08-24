export default async function handler(req, res) {
  const q = req.query?.q ?? ''
  const response = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`
  )
  const data = await response.json()
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json(data)
}
