const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @description Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean()

  if (!users?.length) {
    return res.status(400).json({ message: 'No users found'})
  }

  res.json(users)
})

// @description Create a new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body

  // confirm data
  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  // check for duplicate
  const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()
  if (duplicate) {
    return res.status(400).json({ message: 'Duplicated username' })
  }

  // if all find, then hash the password
  const hashedPassword = await bcrypt.hash(password, 10) // 10 rounds of salt

  // create and store new user
  const userObject = (!Array.isArray(roles) || !roles.length)
    ? {
        username: username,
        password: hashedPassword
      }
    : {
        username: username,
        password: hashedPassword,
        roles: roles
      }

  const user = await User.create(userObject)

  if (user) {
    res.status(201).json({ message: `New user '${user.username}' created`})
  } else {
    res.status(400).json({ message: 'Invalid user data received' })
  }
})

// @description Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, _id, username, password, roles, active } = req.body

  const userId = id ? id : _id

  // confirm data
  if (!userId || !username || !Array.isArray(roles) || !roles.length || typeof(active) !== 'boolean') {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const user = await User.findById(userId).exec()

  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  // check duplicate
  const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()
  // Allow updates only to current user
  if (duplicate && duplicate?._id.toString() !== userId) {
    return res.status(409).json({ message: 'Username already exist' })
  }

  user.username = username
  user.roles = roles
  user.active = active
  if (password) {
    user.password = await bcrypt.hash(password, 10)
  }

  const updatedUser = await user.save()

  res.json({ message: `User with id: ${updatedUser._id} updated` })
})

// @description Delete a user only if the user does not have assigned note
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id, _id } = req.body

  const userId = id ? id : _id

  if (!userId) {
    return res.status(400).json({ message: 'User ID required' })
  }

  // find if a user has assigned note
  const note = await Note.findOne({ user: userId }).lean().exec()
  if (note) {
    return res.status(400).json({ message: 'User has assigned note' })
  }

  const user = await User.findById(userId).exec()
  if (!user) {
    return res.status(400).json({ message: 'User not found' })
  }

  const result = await user.deleteOne()

  const reply = `Username '${result.username}' with id '${result.id}' successfully deleted`

  res.json(reply)
})

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser
}
