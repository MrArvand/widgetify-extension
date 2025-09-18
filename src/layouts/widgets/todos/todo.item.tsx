import { useEffect, useState } from 'react'
import { FiChevronDown, FiRotateCcw, FiTrash2 } from 'react-icons/fi'
import { MdDragIndicator } from 'react-icons/md'
import { Button } from '@/components/button/button'
import CustomCheckbox from '@/components/checkbox'
import type { Todo } from '../calendar/interface/todo.interface'

interface Prop {
	todo: Todo
	toggleTodo: (id: string) => void
	deleteTodo: (id: string) => void
	blurMode?: boolean
	isDragging?: boolean
	dragHandle?: any
}

const translatedPriority = {
	low: 'کم',
	medium: 'متوسط',
	high: 'زیاد',
}

export function TodoItem({
	todo,
	deleteTodo,
	toggleTodo,
	blurMode = false,
	isDragging = false,
	dragHandle,
}: Prop) {
	const [expanded, setExpanded] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [countdown, setCountdown] = useState(5)

	useEffect(() => {
		let timer: NodeJS.Timeout

		if (isDeleting && countdown > 0) {
			timer = setTimeout(() => {
				setCountdown(countdown - 1)
			}, 1000)
		} else if (isDeleting && countdown === 0) {
			deleteTodo(todo.id)
		}

		return () => clearTimeout(timer)
	}, [isDeleting, countdown, deleteTodo, todo.id])

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation()
		setIsDeleting(true)
		setCountdown(5)
	}

	const handleExpand = (e: React.MouseEvent) => {
		e.stopPropagation()
		setExpanded(!expanded)
	}

	const handleUndo = () => {
		setIsDeleting(false)
		setCountdown(5)
	}

	const getBorderStyle = () => {
		switch (todo.priority) {
			case 'high':
				return '!border-error'
			case 'medium':
				return '!border-warning'
			case 'low':
				return '!border-success'
			default:
				return '!border-primary'
		}
	}

	const getCheckedCheckboxStyle = () => {
		switch (todo.priority) {
			case 'high':
				return '!border-error !bg-error'
			case 'medium':
				return '!border-warning !bg-warning'
			case 'low':
				return '!border-success !bg-success'
			default:
				return '!border-primary !bg-primary'
		}
	}

	const getUnCheckedCheckboxStyle = () => {
		switch (todo.priority) {
			case 'high':
				return '!border-error'
			case 'medium':
				return '!border-warning'
			case 'low':
				return '!border-success'
			default:
				return '!border-primary'
		}
	}

	const getPriorityColor = () => {
		switch (todo.priority) {
			case 'high':
				return 'bg-error/10 text-error'
			case 'medium':
				return 'bg-warning/10 text-warning'
			case 'low':
				return 'bg-success/10 text-success'
			default:
				return 'bg-primary text-primary-content'
		}
	}
	return (
		<div
			className={`px-1 py-[1px] bg-base-300/90 hover:bg-base-300 border border-base-300/60 active:scale-98 cursor-pointer group overflow-hidden rounded-lg transition delay-150 duration-300 ease-in-out ${blurMode ? 'blur-item' : ''} ${isDragging ? 'opacity-50' : ''}`}
		>
			{isDeleting ? (
				<div className="flex items-center justify-between p-1.5">
					<div className="flex items-center gap-2">
						<span className="text-sm text-error">
							حذف در {countdown} ثانیه...
						</span>
					</div>
					<Button
						onClick={handleUndo}
						size="xs"
						isPrimary={false}
						rounded="full"
						className="!p-1 !text-error hover:!bg-red-500/10"
					>
						<FiRotateCcw size={15} />
						بازگردانی
					</Button>
				</div>
			) : (
				<>
					<div
						onClick={() => toggleTodo(todo.id)}
						className={'flex items-center gap-2 pr-0.5 py-1'}
					>
						<div className="flex flex-row items-center gap-1">
							<div
								{...dragHandle}
								className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded opacity-100 transition-opacity duration-200"
								onClick={(e) => e.stopPropagation()}
							>
								<MdDragIndicator size={12} className="text-muted" />
							</div>

							<div className="flex-shrink-0">
								<CustomCheckbox
									checked={todo.completed}
									onChange={() => toggleTodo(todo.id)}
									className={`!w-[1.125rem] !h-[1.125rem] !border ${getBorderStyle()}`}
									unCheckedCheckBoxClassName={`${getUnCheckedCheckboxStyle()}`}
									checkedCheckBoxClassName={`${getCheckedCheckboxStyle()}`}
								/>
							</div>
						</div>

						<span
							className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-xs ${todo.completed ? 'line-through text-content opacity-60' : 'text-content'}`}
						>
							{todo.text}
						</span>

						{/* Actions */}
						<div className="flex items-center gap-x-1">
							<button
								onClick={handleDelete}
								className={
									'p-1 rounded-full cursor-pointer hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 delay-100 group-hover:select-none'
								}
							>
								<FiTrash2 size={13} />
							</button>

							<button
								onClick={handleExpand}
								className={
									'p-1 rounded-full cursor-pointer hover:bg-gray-500/10 text-gray-400'
								}
							>
								<FiChevronDown
									size={14}
									className={`${expanded ? 'rotate-0' : 'rotate-180'} transition-transform duration-300`}
								/>
							</button>
						</div>
					</div>

					{expanded && (
						<div
							className={
								'px-2 pb-1.5 text-[10px] text-content transition-all'
							}
						>
							<p className="mt-0.5 mb-1 break-words">{todo.text}</p>

							<div className="flex items-center gap-1.5 mt-0.5 mb-1">
								{todo.category && (
									<span
										className={`text-[10px] px-1 py-0.25 rounded-full ${getPriorityColor()}`}
									>
										{todo.category}
									</span>
								)}
								<span
									className={`text-[10px] px-1 py-0.25 rounded-full ${getPriorityColor()}`}
								>
									{translatedPriority[todo.priority]}
								</span>
								<span>{todo.date}</span>
							</div>

							{/* Notes */}
							{todo.notes && (
								<p className="mt-0.5 font-light">{todo.notes}</p>
							)}
						</div>
					)}
				</>
			)}
		</div>
	)
}
