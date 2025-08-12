const UserModel = require('../models/user.model');

class UserService {
    static async listUsers() {
        return UserModel.listUsers();
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
}

module.exports = UserService;
