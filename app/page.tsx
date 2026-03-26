"use client"

import dynamic from 'next/dynamic'

const HomeClient = dynamic(() => import('./page.client'), {
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-background" />
})

export default function Home() {
  return <HomeClient />
}