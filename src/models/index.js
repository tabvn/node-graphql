import User from './user'
import Token from "./token";
import Role from "./role";
import UserRole from "./user_role";

export default class Models {

    constructor(ctx) {

        this._models = {
            user: new User(ctx),
            token: new Token(ctx),
            role: new Role(ctx),
            user_role: new UserRole(ctx),
        };

    }

    getModels() {

        return this._models;
    }
}