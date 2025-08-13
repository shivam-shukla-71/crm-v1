const UserModel = require('../models/user.model');

class UserService {
    static async listUsers() {
        return UserModel.listUsers();
    }

    static async listUsersByEntity(entityId) {
        return UserModel.listUsersByEntity(entityId);
    }

    static async createUser(userInput) {
        // Creation by admin marks verified true by default? Keep as false to follow flow
        return UserModel.createUser({
            ...userInput,
            password_hash: userInput.password_hash // controller should hash
        });
    }

    static async updateUser(userId, fields) {
        return UserModel.updateUser(userId, fields);
    }

    static async changeRole(userId, roleId) {
        return UserModel.changeRole(userId, roleId);
    }

    static async deleteUser(userId) {
        return UserModel.deleteUser(userId);
    }

    static async findByEntity(entityId) {
        return UserModel.findByEntity(entityId);
    }
}

module.exports = UserService;
