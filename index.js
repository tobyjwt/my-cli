#!/usr/bin/env node
console.log('cli run');
const fs = require('fs');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
// console.log(process);
console.log(process.env.PWD);
console.log(process.argv);
let createPath = '';
program.action((checkname,option) => {
    if (checkname === 'init') {
        createPath = option;
    }
    // 获得了参数，可以在这里做响应的业务处理
});
program.parse(process.argv);
console.log(createPath);
if (!createPath) {
    console.log(chalk.red('未检测到项目名，示例 test-cli init project-name'));
    return;
} else if (/ /.test(createPath)) {
    console.log(chalk.red('项目名不能包含空格'));
    return;
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

console.log(chalk.green('👉初始化成功，使用如下命令开始你的项目\n'));
console.log(chalk.gray('$ ') + chalk.cyan('cd ' + createPath));
console.log(chalk.gray('$ ') + chalk.cyan('npm run serve'));
