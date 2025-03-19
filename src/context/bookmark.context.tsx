import React, { createContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getFromStorage, setToStorage } from '@/common/storage'
import type { Bookmark } from 'W/layouts/search/bookmarks/types/bookmark.types'

const MAX_BOOKMARK_SIZE = 1.5 * 1024 * 1024

export interface BookmarkStoreContext {
	bookmarks: Bookmark[]
	setBookmarks: (bookmarks: Bookmark[]) => void
	getCurrentFolderItems: (parentId: string | null) => Bookmark[]
	addBookmark: (bookmark: Bookmark) => void
	deleteBookmark: (id: string) => void
}

const bookmarkContext = createContext<BookmarkStoreContext>({
	bookmarks: [],
	setBookmarks: () => {},
	getCurrentFolderItems: () => [],
	addBookmark: () => {},
	deleteBookmark: () => {},
})

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

	useEffect(() => {
		const loadBookmarks = async () => {
			const storedBookmarks = await getFromStorage('bookmarks')
			if (Array.isArray(storedBookmarks)) {
				setBookmarks(storedBookmarks)
			}
		}
		loadBookmarks()
	}, [])

	useEffect(() => {
		const saveBookmarks = async () => {
			const localBookmarks = bookmarks.filter((b) => b.isLocal)
			await setToStorage('bookmarks', localBookmarks)
		}

		const hasLocalBookmarks = bookmarks.some((b) => b.isLocal)
		if (hasLocalBookmarks) {
			saveBookmarks()
		}
	}, [bookmarks])

	const getCurrentFolderItems = (parentId: string | null) => {
		const pinnedBookmarks = bookmarks.filter((bookmark) => bookmark.pinned)
		const currentFolderBookmarks = bookmarks.filter(
			(bookmark) => bookmark.parentId === parentId && !bookmark.pinned,
		)

		return parentId === null
			? [...pinnedBookmarks, ...currentFolderBookmarks]
			: currentFolderBookmarks
	}

	const getBookmarkDataSize = (bookmark: Bookmark): number => {
		try {
			if (bookmark.customImage) {
				const base64Data = bookmark.customImage.split(',')[1] || bookmark.customImage

				const imageSize = Math.ceil((base64Data.length * 3) / 4)

				const bookmarkWithoutImage = { ...bookmark }
				bookmarkWithoutImage.customImage = undefined
				const jsonSize = new Blob([JSON.stringify(bookmarkWithoutImage)]).size

				return imageSize + jsonSize
			}

			const json = JSON.stringify(bookmark)
			return new Blob([json]).size
		} catch (e) {
			console.error('Error calculating bookmark size:', e)
			return Number.POSITIVE_INFINITY
		}
	}

	const compressImageData = async (imageData: string): Promise<string> => {
		if (!imageData.startsWith('data:image')) {
			return imageData
		}

		if (imageData.startsWith('data:image/gif') && imageData.length < MAX_BOOKMARK_SIZE) {
			return imageData
		}

		try {
			const base64 = imageData.split(',')[1]
			const binaryString = window.atob(base64)
			const length = binaryString.length

			if (length > 3 * 1024 * 1024) {
				throw new Error('Image is too large to process')
			}

			return new Promise((resolve) => {
				const img = new Image()
				img.onload = () => {
					const canvas = document.createElement('canvas')
					const ctx = canvas.getContext('2d')
					const maxDimension = 128

					let width = img.width
					let height = img.height

					if (width > height) {
						if (width > maxDimension) {
							height = Math.round(height * (maxDimension / width))
							width = maxDimension
						}
					} else {
						if (height > maxDimension) {
							width = Math.round(width * (maxDimension / height))
							height = maxDimension
						}
					}

					canvas.width = width
					canvas.height = height

					ctx?.drawImage(img, 0, 0, width, height)

					const format = imageData.startsWith('data:image/gif')
						? 'image/png'
						: 'image/webp'
					const quality = 0.7

					const compressed = canvas.toDataURL(format, quality)
					resolve(compressed)
				}

				img.onerror = () => {
					console.warn('Image compression failed, using original')
					resolve(imageData)
				}

				img.src = imageData
			})
		} catch (e) {
			console.error('Error in image compression:', e)
			return imageData
		}
	}

	const prepareBookmarkForStorage = async (bookmark: Bookmark): Promise<Bookmark> => {
		const processedBookmark = { ...bookmark, isLocal: true }

		if (processedBookmark.customImage && processedBookmark.customImage.length > 50000) {
			try {
				processedBookmark.customImage = await compressImageData(
					processedBookmark.customImage,
				)
			} catch (err) {
				console.error('Image processing error:', err)
				toast.error('خطا در پردازش تصویر. از تصویر پیش‌فرض استفاده می‌شود.')

				if (processedBookmark.type === 'BOOKMARK') {
					processedBookmark.customImage = undefined
				}
			}
		}

		return processedBookmark
	}

	const addBookmark = async (bookmark: Bookmark) => {
		try {
			const bookmarkSize = getBookmarkDataSize(bookmark)

			const isGif = bookmark.customImage?.startsWith('data:image/gif')
			const sizeLimit = isGif ? 1.5 * MAX_BOOKMARK_SIZE : MAX_BOOKMARK_SIZE

			if (bookmarkSize > sizeLimit) {
				toast.error(
					`تصویر انتخاب شده (${(bookmarkSize / 1024).toFixed(1)} کیلوبایت) بزرگتر از حداکثر مجاز است.`,
				)
				return
			}

			const newBookmark = await prepareBookmarkForStorage(bookmark)
			const updatedBookmarks = [...bookmarks, newBookmark]

			try {
				const testData = JSON.stringify(updatedBookmarks.filter((b) => b.isLocal))
				if (testData.length > 5 * 1024 * 1024) {
					toast.error(
						'حجم بوکمارک‌ها بیش از حد مجاز است. لطفاً برخی بوکمارک‌ها را حذف کنید.',
					)
					return
				}
			} catch (e) {
				toast.error('خطا در ذخیره‌سازی بوکمارک. داده‌ها بیش از حد بزرگ هستند.')
				return
			}

			setBookmarks(updatedBookmarks)
			const localBookmarks = updatedBookmarks.filter((b) => b.isLocal)
			await setToStorage('bookmarks', localBookmarks)
		} catch (error) {
			console.error('Error adding bookmark:', error)
			toast.error('خطا در افزودن بوکمارک')
		}
	}

	const getNestedItems = (parentId: string, visited = new Set<string>()): string[] => {
		visited.add(parentId)
		const result: string[] = []
		const children = bookmarks.filter((b) => b.parentId === parentId)

		for (const child of children) {
			result.push(child.id)

			if (child.type === 'FOLDER' && !visited.has(child.id)) {
				const nestedItems = getNestedItems(child.id, new Set(visited))
				for (const nestedItem of nestedItems) {
					result.push(nestedItem)
				}
			}
		}

		return result
	}

	const deleteBookmark = async (id: string) => {
		const bookmarkToDelete = bookmarks.find((b) => b.id === id)
		if (!bookmarkToDelete) return

		let itemsToDelete = [id]

		if (bookmarkToDelete.type === 'FOLDER') {
			const nestedItems = getNestedItems(id)
			itemsToDelete = [...itemsToDelete, ...nestedItems]
		}

		const updatedBookmarks = bookmarks.filter((b) => !itemsToDelete.includes(b.id))
		setBookmarks(updatedBookmarks)

		const localBookmarks = updatedBookmarks.filter((b) => b.isLocal)
		await setToStorage('bookmarks', localBookmarks)

		const deletedList = (await getFromStorage('deletedBookmarkIds')) || []
		deletedList.push(...itemsToDelete)
		await setToStorage('deletedBookmarkIds', deletedList)
	}

	return (
		<bookmarkContext.Provider
			value={{
				bookmarks,
				setBookmarks,
				getCurrentFolderItems,
				addBookmark,
				deleteBookmark,
			}}
		>
			{children}
		</bookmarkContext.Provider>
	)
}

export function useBookmarkStore(): BookmarkStoreContext {
	const context = React.useContext(bookmarkContext)
	if (!context) {
		throw new Error('useBookmarkStore must be used within a BookmarkProvider')
	}
	return context
}
