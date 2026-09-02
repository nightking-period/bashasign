import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Home } from '@/pages/Home'
import { Communicate } from '@/pages/Communicate'
import { Phrasebook } from '@/pages/Phrasebook'
import { SignRecognition } from '@/pages/SignRecognition'
import { DatasetCollector } from '@/pages/DatasetCollector'
import { Learn } from '@/pages/Learn'
import { Settings } from '@/pages/Settings'
import { Session } from '@/pages/Session'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'session', element: <Session /> },
      { path: 'communicate', element: <Communicate /> },
      { path: 'phrasebook', element: <Phrasebook /> },
      { path: 'sign-recognition', element: <SignRecognition /> },
      { path: 'collector', element: <DatasetCollector /> },
      { path: 'learn', element: <Learn /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])


export function App() {
  return <RouterProvider router={router} />
}
