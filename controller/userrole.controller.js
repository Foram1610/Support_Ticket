const { UserRole } = require('../models')
const { getAllData } = require('../middleware/getAllData')

exports.insertRole = async (req, res) => {
    try {
        const { role } = req.body
        const role1 = await UserRole.findOne({ where: { role: role } })
        if (role1) {
            return res.status(409).json({ message: 'This user role is already exits!!' })
        }
        const userrole = await UserRole.create({ role })
        if (!userrole) {
            return res.status(400).json({ data: err })
        }
        return res.status(200).json({ message: 'Role inserted!!' })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}

// exports.getRole = async (req, res) => {
//     try {
//         const roles = await UserRole.findAll()
//         return res.status(200).json({ message: 'Success', data: roles })
//     } catch (error) {
//         return res.status(400).json({ message: error.message })
//     }
// }

exports.getRole = async (req, res) => {
    try {
        const roles = await getAllData(req.body, UserRole)
        return res.status(200).json(roles)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
}