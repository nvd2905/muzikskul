const BASE = 'https://api.mihong.vn/v1'

export type GoldPrice = {
  code: string
  buyingPrice: number
  sellingPrice: number
  sellChange: number
  sellChangePercent: number
  buyChange: number
  buyChangePercent: number
  dateTime: string
}

export type GoldPricePoint = {
  buyingPrice: number
  sellingPrice: number
  code: string
  dateTime: string
}

export async function getDomesticGoldPrices(): Promise<GoldPrice[]> {
  const res = await fetch(`${BASE}/gold-prices?market=domestic`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`gold-prices fetch failed: ${res.status}`)
  return res.json() as Promise<GoldPrice[]>
}

export async function getSJCHistory24h(): Promise<GoldPricePoint[]> {
  const res = await fetch(`${BASE}/gold-prices?market=domestic&goldCode=SJC&last=24h`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`SJC history fetch failed: ${res.status}`)
  return res.json() as Promise<GoldPricePoint[]>
}
