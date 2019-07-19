#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const semver = require('semver');
const requiredVersion = require('./package.json').engines.node;
const cp = require('child_process');
const execa = require('execa');
const minimist = require('minimist');

// console.log(process);
// console.log(process.env.PWD);
// console.log(process.argv);

function checkNodeVersion (wanted, id) {
    if (!semver.satisfies(process.version, wanted)) {
        console.log(chalk.red(
            'You are using Node ' + process.version + ', but this version of ' + id +
            ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'
        ));
        process.exit(1);
    }
}

checkNodeVersion(requiredVersion, 'vue-cli');

if (semver.satisfies(process.version, '10.x')) {
    console.log(chalk.red(
        `You are using Node ${process.version}.\n` +
        `Node.js 9.x has already reached end-of-life and will not be supported in future major releases.\n` +
        `It's strongly recommended to use an active LTS version instead.`
    ))
}

let createPath = '';
program
    .command('create <app-name>')
    .description('create a new project')
    .action((name, cmd) => {
        // console.log(name, cmd);
        createPath = name;
        // const options = cleanArgs(cmd);
        // console.log(options);

        if (minimist(process.argv.slice(3))._.length > 1) {
            console.log(chalk.yellow('\n Info: You provided more than one argument. The first one will be used as the app\'s name, the rest are ignored.'))
        }
    });
    // 获得了参数，可以在这里做响应的业务处理
// });
program.parse(process.argv);
console.log(createPath);
if (!createPath) {
    console.log(chalk.red('未检测到项目名，示例 test-cli init project-name'));
    process.exit(1)
} else if (/ /.test(createPath)) {
    console.log(chalk.red('项目名不能包含空格'));
    process.exit(1)
}
let fullPath = process.env.PWD + '/' + createPath;
console.log('createPath=', createPath);

// 复制文件
function copyTemplate(from, to) {
    from = path.join(__dirname, 'templates', from);
    // console.log(from);
    write(to, fs.readFileSync(from, 'utf-8'))
}

function write(path, str, mode) {
    fs.writeFileSync(path, str)
}

// 新建目录
function mkdir(path, fn) {
    fs.mkdir(path, function (err) {
        fn && fn()
    })
}

let copy = function (src, dst) {
    // console.log('copy', src, dst);
    let paths = fs.readdirSync(src); //同步读取当前目录(只能读取绝对路径，相对路径无法获取)
    // console.log(paths);
    paths.forEach(function (path) {
        var _src = src + '/' + path;
        var _dst = dst + '/' + path;
        fs.stat(_src, function (err, stats) {  //stats  该对象 包含文件属性
            if (err) throw err;
            if (stats.isFile()) { //如果是个文件则拷贝
                let readable = fs.createReadStream(_src);//创建读取流
                let writable = fs.createWriteStream(_dst);//创建写入流
                readable.pipe(writable);
            } else if (stats.isDirectory()) { //是目录则 递归
                checkDirectory(_src, _dst, copy);
            }
        });
    });
};
let checkDirectory = function (src, dst, callback) {
    fs.access(dst, fs.constants.F_OK, (err) => {
        if (err) {
            fs.mkdirSync(dst);
            callback(src, dst);
        } else {
            callback(src, dst);
        }
    });
};

mkdir(fullPath, function () {
    checkDirectory(path.join(__dirname,'template'), fullPath, copy);
});

// cp.exec();

afterCopy();

async function afterCopy() {
    // await run('echo
    // "test"');
    console.log(chalk.green('install...'))
    execa("npm", ["install"], {
        cwd: './' + createPath
    }).then(res => {
        console.log(res.stdout);
        console.log(chalk.green('👉初始化成功，使用如下命令开始你的项目\n'));
        console.log(chalk.gray('$ ') + chalk.cyan('cd ' + createPath));
        console.log(chalk.gray('$ ') + chalk.cyan('npm run serve'));
    });
}

function camelize (str) {
    return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs (cmd) {
    const args = {};
    cmd.options.forEach(o => {
        const key = camelize(o.long.replace(/^--/, ''))
        // if an option is not present and Command has a method with the same name
        // it should not be copied
        if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
            args[key] = cmd[key]
        }
    });
    return args;
}

function run (command, args) {
    console.log(this.context);
    if (!args) { [command, ...args] = command.split(/\s+/) }
    return execa(command, args, { cwd: this.context })
}
