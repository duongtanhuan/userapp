export class User {
    public id : number;
    public userId : string;
    public firstName : string;
    public lastName : string;
    public userName : string;
    // public passWord : string;
    public email : string;
    public loginDateDisplay : Date;
    public lastLoginDateDisplay: Date;
    public joinDate : Date;
    public profileImageUrl : string;
    public role : any;
    public authorities : [];
    public isActive : boolean;
    public isNotLocked : boolean;

    constructor() {
        this.firstName = '';
        this.lastName = '';
        this.userName = '';
        this.email = '';
        this.isActive = false;
        this.isNotLocked = false;
        this.role = '';
        this.authorities = [];
    }
}