import { useAuth } from '@/context/auth.context'
import { useEffect, useState } from 'react'
import { WidgetContainer } from '../widgets/widget-container'
import { EmailTab } from '../widgets/wigiPad/info-panel/tabs/email/email-tab'
import { Pet } from './pets/pet'
import { PetProvider } from './pets/pet.context'
import { useNotificationCenter } from './hooks/useNotificationCenter'

export const WidgetifyLayout = () => {
	const { user, isAuthenticated } = useAuth()
	const { emailMessages } = useNotificationCenter()

	const [userName, setUserName] = useState<string>('')

	useEffect(() => {
		if (isAuthenticated && user && user.name) {
			setUserName(user.name)
		}
	}, [isAuthenticated, user])

	return (
		<WidgetContainer className="overflow-hidden">
			<div className="relative w-full h-full">
				{
					<PetProvider>
						<Pet />
					</PetProvider>
				}

				<div className="relative z-10 flex flex-col items-center h-64 gap-1 overflow-y-auto small-scrollbar">
					<div
						className={
							'flex items-center w-full pb-1 border-b border-content'
						}
					>
						<div className="flex items-center gap-2">
							<p className="w-32 text-sm font-semibold truncate">
								سلام {userName || '👋'}
							</p>
						</div>
					</div>

					{/* Daily Summary Content */}
					<div className="flex-1 w-full pt-1.5 overflow-y-auto small-scrollbar">
						<div className="space-y-1">
							{/* <GoogleOverviewCard /> */}
							{/* <TodoOverviewCard /> */}
							<EmailTab emailMessages={emailMessages} />
						</div>
					</div>
				</div>
			</div>
		</WidgetContainer>
	)
}
