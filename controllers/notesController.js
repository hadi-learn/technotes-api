const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

// @description Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean()

  if (!notes?.length) {
    return res.status(400).json({ message: 'No notes found' })
  }

  const notesWithUsername = await Promise.all(notes.map(async (note) => {
    const user = await User.findById(note.user).lean().exec()
    return { ...note, username: user.username}
  }))

  res.json(notesWithUsername)
})

// @description Get all notes
// @route GET /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req.body

  if (!user || !title || !text) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

  if (duplicate && duplicate?.user.toString() === user) {
    return res.status(400).json({ message: 'Note title already exist' })
  }
  
  const noteObject = {
    user: user,
    title: title,
    text: text
  }

  const note = await Note.create(noteObject)

  if (note) {
    res.status(201).json({ message: 'New note created' })
  } else {
    res.status(400).json({ message: 'Invalid note data received' })
  }
})

// @description Get all notes
// @route GET /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
  const { id, _id, user, title, text, completed } = req.body
  const noteId = id ? id : _id

  if (!noteId || !user || !title || !text || typeof(completed) !== 'boolean') {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const note = await Note.findById(noteId).exec()

  if (!note) {
    return res.status(400).json({ message: 'Note not found' })
  }

  const noteOwner = await User.findById(user).lean().exec()
  if (!noteOwner) {
    return res.status(400).json({ message: 'Note owner not found' })
  }

  const duplicate = await Note.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

  if (duplicate && duplicate?._id.toString() !== noteId) {
    return res.status(409).json({ message: 'Duplicate note title' })
  }

  note.user = user
  note.title = title
  note.text = text
  note.completed = completed

  const updatedNote = await note.save()

  res.json({ message: `${updatedNote.title} updated` })
})

// @description Get all notes
// @route GET /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
  const { id, _id } = req.body

  const noteId = id ? id : _id

  if (!noteId) {
    return res.status(400).json({ message: 'Note ID required'})
  }

  const note = await Note.findById(noteId).exec()
  if (!note.completed) {
    return res.status(409).json({ message: 'Note status not completed' })
  }

  const result = await note.deleteOne()

  const reply = `Note '${result.title}' with id '${result._id}' successfully deleted`

  res.json(reply)
})

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote
}