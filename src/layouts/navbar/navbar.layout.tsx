import { FaGithub } from 'react-icons/fa6'

export interface PageLink {
	name: string
	to: string
}

export function NavbarLayout(): JSX.Element {
	return (
		<nav className="flex items-center justify-between px-5 py-3">
			<div className="flex items-center">
				<h1 className="text-2xl text-blue-400 font-[balooTamma]">Widgetify</h1>
			</div>

			<a
				href="https://github.com/widgetify-app/widgetify-pwa"
				target="_blank"
				rel="noopener noreferrer"
				className="flex items-center justify-center w-10 h-10 dark:bg-[#1e1e1e] rounded-xl text-gray-400 hover:text-gray-300 hover:bg-[#252525] transition-colors"
			>
				<FaGithub size={22} />
			</a>
		</nav>
	)
}
