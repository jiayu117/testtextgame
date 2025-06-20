// 初始化，页面加载完毕后执行
// 修改默认tab为关卡选择
// document.addEventListener('DOMContentLoaded', () => {
//     showTab('blacksmith');
//     loadAllGameData();
//     renderTestBtnsMiddle();
// });
document.addEventListener('DOMContentLoaded', () => {
    showTab('stages');
    loadAllGameData();
    renderTestBtnsMiddle();
});

/**
 * 显示指定的Tab页
 * @param {string} tabId 要显示的tab的ID
 */
function showTab(tabId) {
    // 隐藏所有tab内容
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });

    // 移除所有按钮的 'active' class
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // 显示指定的tab内容
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // 为对应的按钮添加 'active' class
    const activeButton = document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    renderTestBtnsMiddle();
}

// -------------------
// 游戏核心逻辑将在此处添加
// ------------------- 

// -------------------
// 游戏数据加载模块
// -------------------

// 通用加载函数
async function loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`无法加载 ${path}：${response.statusText}`);
    }
    return await response.json();
}

// 全局数据变量
let items = [];
let monsters = [];
let skillshop = [];
let stages = [];
let workshop = [];

// 加载所有数据
async function loadAllGameData() {
    [items, monsters, skillshop, stages, workshop] = await Promise.all([
        loadJSON('data/item.json'),
        loadJSON('data/monsters.json'),
        loadJSON('data/skillshop.json'),
        loadJSON('data/stage.json'),
        loadJSON('data/workshop.json')
    ]);
    // 数据加载完成后，可以初始化游戏
    console.log('装备表', items);
    console.log('怪物表', monsters);
    console.log('技能商店表', skillshop);
    console.log('关卡表', stages);
    console.log('铁匠铺表', workshop);
    // 这里可以调用后续的初始化函数
    renderBlacksmith();
}

// -------------------
// 角色创建与属性roll点
// -------------------

const mainAttributes = [
    { key: 'str', name: '力量' },
    { key: 'agi', name: '敏捷' },
    { key: 'int', name: '智力' },
    { key: 'all', name: '全才' }
];

let hero = null;

function randomMainAttr() {
    return mainAttributes[Math.floor(Math.random() * mainAttributes.length)];
}

function randomGrowth() {
    // 力量、敏捷、智力成长分别在1~3之间，三者总和在6~8之间
    let total = (Math.random() * 2 + 6).toFixed(1); // 6~8
    let g1 = +(Math.random() * 2 + 1).toFixed(1);
    let g2 = +(Math.random() * 2 + 1).toFixed(1);
    let g3 = +(total - g1 - g2).toFixed(1);
    // 防止有负数，重新roll
    if (g3 < 1 || g3 > 3) return randomGrowth();
    // 随机排列顺序
    let arr = [g1, g2, g3];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function rollHero() {
    const mainAttr = randomMainAttr();
    const growth = randomGrowth();
    let growthObj = {};
    if (mainAttr.key === 'str') {
        growthObj = { 力量: growth[0], 敏捷: growth[1], 智力: growth[2] };
    } else if (mainAttr.key === 'agi') {
        growthObj = { 力量: growth[1], 敏捷: growth[0], 智力: growth[2] };
    } else if (mainAttr.key === 'int') {
        growthObj = { 力量: growth[1], 敏捷: growth[2], 智力: growth[0] };
    } else {
        growthObj = { 力量: growth[0], 敏捷: growth[1], 智力: growth[2] };
    }
    return {
        mainAttr,
        growth: growthObj
    };
}

let currentRoll = rollHero();

function updateRollResult() {
    const resultDiv = document.getElementById('roll-result');
    resultDiv.innerHTML =
        `<div>主属性：<b>${currentRoll.mainAttr.name}</b></div>` +
        `<div>
            <span onmouseover="showAttrTooltip('str', event)" onmouseout="hideAttrTooltip()">力量成长：<b>${currentRoll.growth.力量}</b></span>，
            <span onmouseover="showAttrTooltip('agi', event)" onmouseout="hideAttrTooltip()">敏捷成长：<b>${currentRoll.growth.敏捷}</b></span>，
            <span onmouseover="showAttrTooltip('int', event)" onmouseout="hideAttrTooltip()">智力成长：<b>${currentRoll.growth.智力}</b></span>
        </div>`;
}

function checkStartBtn() {
    const name = document.getElementById('hero-name-input').value.trim();
    document.getElementById('start-btn').disabled = !(name.length > 0);
}

document.getElementById('roll-btn').onclick = function() {
    currentRoll = rollHero();
    updateRollResult();
};
document.getElementById('hero-name-input').oninput = checkStartBtn;

// 初始化角色装备和背包
function initHeroEquipsAndBag() {
    if (!hero) return;
    hero.equips = {};
    EQUIP_PARTS.forEach(part => { hero.equips[part.id] = null; });
    hero.bag = [];
}

// 角色创建后立即初始化装备和背包
const oldStartBtnClick = document.getElementById('start-btn').onclick;
document.getElementById('start-btn').onclick = function() {
    // 1. 初始化 hero 对象
    const name = document.getElementById('hero-name-input').value.trim();
    hero = {
        name: name,
        mainAttr: currentRoll.mainAttr,
        mainAttrName: currentRoll.mainAttr.name,
        growth: currentRoll.growth,
        str: 5,
        agi: 5,
        int: 5,
        level: 1,
        exp: 0,
        gold: 0,
        skillShards: 0,
        equips: {},
        bag: []
    };
    // 2. 初始化装备和背包
    initHeroEquipsAndBag();
    // 3. 渲染角色相关面板
    renderEquips();
    renderBag();
    renderHeroStats();
    // 4. 隐藏角色创建遮罩层
    document.getElementById('create-hero-mask').style.display = 'none';
};

// 初始显示roll结果
updateRollResult();
checkStartBtn();

// 计算升级所需经验
function getExpToLevelUp(level) {
    return 50 + (level - 1) * 50;
}

// 养成信息框日志追加函数
function addGrowthLog(msg) {
    const logDiv = document.getElementById('growth-log');
    if (!logDiv) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.innerHTML = `<span style='color:#aaa'>[${time}]</span> ${msg}`;
    logDiv.appendChild(entry);
    // 滚动到底部
    logDiv.scrollTop = logDiv.scrollHeight;
}

// 角色获得经验（重写提示方式）
function gainExp(amount) {
    if (!hero) return;
    hero.exp += amount;
    addGrowthLog(`<span style='color:#ffd700'>获得经验：+${amount}</span>`);
    let leveledUp = false;
    let oldLevel = hero.level;
    while (hero.exp >= getExpToLevelUp(hero.level)) {
        hero.exp -= getExpToLevelUp(hero.level);
        hero.level++;
        // 升级时提升属性
        hero.str = +(hero.str + parseFloat(hero.growth.力量)).toFixed(1);
        hero.agi = +(hero.agi + parseFloat(hero.growth.敏捷)).toFixed(1);
        hero.int = +(hero.int + parseFloat(hero.growth.智力)).toFixed(1);
        leveledUp = true;
    }
    renderHeroStats();
    if (leveledUp) {
        addGrowthLog(`<span style='color:#4dff4d'>升级！等级提升至${hero.level}，属性成长！</span>`);
    }
}

// 示例：获得装备、技能书时调用
function gainItem(itemName) {
    addGrowthLog(`<span style='color:#4d8aff'>获得装备：${itemName}</span>`);
}
function gainSkillBook(skillName) {
    addGrowthLog(`<span style='color:#ff4d4d'>获得技能书：${skillName}</span>`);
}

// ====== 常量和映射表 ======
const RARITY_MAP = {
    1: { name: '普通', en: 'common', color: '#fff', key: 'common' },
    2: { name: '稀有', en: 'rare', color: '#4d8aff', key: 'rare' },
    3: { name: '罕见', en: 'veryRare', color: '#a259ff', key: 'veryRare' },
    4: { name: '珍稀', en: 'extremelyRare', color: '#ffb84d', key: 'extremelyRare' },
    5: { name: '传奇', en: 'legendary', color: '#ff4d4d', key: 'legendary' },
    6: { name: '史诗', en: 'epic', color: '#ffd700', key: 'epic' }
};

const EQUIP_PARTS = [
    {id:1, name:'头部'},
    {id:2, name:'躯干'},
    {id:3, name:'腿部'},
    {id:4, name:'武器'},
    {id:5, name:'腰带'},
    {id:6, name:'手套'},
    {id:7, name:'靴子'},
    {id:8, name:'项链'},
    {id:9, name:'戒指'}
];

// ====== 工具函数 ======
// 叠加装备属性，返回总属性对象
function getTotalHeroAttributes() {
    let str = hero.str, agi = hero.agi, int_ = hero.int;
    let add = {
        Strength: 0, Agility: 0, Intelligence: 0,
        maxHp: 0, hpRegen: 0, armor: 0, magicResist: 0, skillAmp: 0, attack: 0, attackspeed: 0,
        critRate: 0, lifeSteal: 0, stunChance: 0, evasion: 0, statusResist: 0, cooldownReduction: 0, magicLifesteal: 0, damageReduction: 0
    };
    for (const k in hero.equips) {
        const eq = hero.equips[k];
        if (eq) {
            if (eq.Strength) str += Number(eq.Strength), add.Strength += Number(eq.Strength);
            if (eq.Agility) agi += Number(eq.Agility), add.Agility += Number(eq.Agility);
            if (eq.Intelligence) int_ += Number(eq.Intelligence), add.Intelligence += Number(eq.Intelligence);
            [
                'maxHp','hpRegen','armor','magicResist','skillAmp','attack','attackspeed',
                'critRate','lifeSteal','stunChance','evasion','statusResist','cooldownReduction','magicLifesteal','damageReduction'
            ].forEach(key => { if(eq[key]) add[key] += Number(eq[key]); });
        }
    }
    return { str, agi, int_, add };
}

// 装备属性描述显示稀有度和所有属性
function getItemDesc(item) {
    if (!item) return '';
    const rareInfo = RARITY_MAP[item.rarity] || { name: '未知', color: '#fff' };
    let desc = `<b style='color:${rareInfo.color}'>${item.name}_Lv.${item.itemLv}</b><br>`;
    desc += `稀有度：<span style='color:${rareInfo.color}'>${rareInfo.name}</span><br>`;
    desc += `等级：${item.itemLv}<br>`;
    [
        ['Strength', '力量'], ['Agility', '敏捷'], ['Intelligence', '智力'],
        ['maxHp', '生命值'], ['hpRegen', '生命恢复'], ['armor', '护甲'], ['magicResist', '魔法抗性'],
        ['skillAmp', '技能增强'], ['attack', '攻击力'], ['attackspeed', '攻击速度'],
        ['critRate', '暴击率'], ['lifeSteal', '物理吸血'], ['stunChance', '击晕率'],
        ['evasion', '闪避率'], ['statusResist', '状态抗性'], ['cooldownReduction', '冷却减缩'],
        ['magicLifesteal', '魔法吸血'], ['damageReduction', '伤害减免']
    ].forEach(([key, label]) => {
        if (item[key] && Number(item[key]) !== 0) desc += `${label}：+${item[key]}<br>`;
    });
    return desc;
}

// ====== 渲染函数 ======
// 装备名称显示为"装备名_Lv.x"，背包排序
function renderEquips() {
    const equipDiv = document.getElementById('player-equipment');
    let html = '<h2>穿戴装备</h2>';
    EQUIP_PARTS.forEach(part => {
        const eq = hero.equips[part.id];
        html += `<div class="equip-slot" data-part="${part.id}"`;
        if (eq) html += ` data-itemid="${eq.itemId}"`;
        html += '>';
        html += `<span class="equip-name"`;
        if (eq) html += ` onmouseover="showItemTooltip(event, ${eq.id}, 'equip')" onmouseout="hideItemTooltip()"`;
        html += '>';
        if (eq) {
            const rareInfo = RARITY_MAP[eq.rarity] || { color: '#fff' };
            html += `<span style='color:${rareInfo.color}'>${eq.name}_Lv.${eq.itemLv}</span>`;
        } else {
            html += `<span style='color:#888'>[${part.name}] 空</span>`;
        }
        html += '</span></div>';
    });
    equipDiv.innerHTML = html;
}

function renderBag() {
    const bagDiv = document.getElementById('player-inventory');
    let html = '<h2>背包</h2>';
    if (hero.bag.length === 0) {
        html += '<div style="color:#888">背包为空</div>';
    } else {
        // 按稀有度从高到低，等级从高到低排序
        const sorted = hero.bag.slice().sort((a, b) => {
            if (b.rarity !== a.rarity) return b.rarity - a.rarity;
            return b.itemLv - a.itemLv;
        });
        sorted.forEach((item, idx) => {
            const rareInfo = RARITY_MAP[item.rarity] || { color: '#fff' };
            html += `<div class="bag-item" data-idx="${idx}" onmouseover="showItemTooltip(event, ${item.id}, 'bag')" onmouseout="hideItemTooltip()" onclick="wearItem(${hero.bag.indexOf(item)})"><span style='color:${rareInfo.color}'>${item.name}_Lv.${item.itemLv}</span></div>`;
        });
    }
    bagDiv.innerHTML = html;
}

// 穿戴装备
function wearItem(idx) {
    const item = hero.bag[idx];
    if (!item) return;
    const part = item.part;
    // 先卸下原装备
    if(hero.equips[part]) {
        hero.bag.push(hero.equips[part]);
    }
    // 穿戴新装备
    hero.equips[part] = item;
    hero.bag.splice(idx,1);
    addGrowthLog(`<span style='color:#4d8aff'>穿戴装备：${item.name}_Lv.${item.itemLv}</span>`);
    renderEquips();
    renderBag();
    renderHeroStats();
}

// 装备属性浮窗
window.showItemTooltip = function(event, itemId, from) {
    let item = null;
    if(from === 'equip') {
        for(const k in hero.equips) if(hero.equips[k] && hero.equips[k].id === itemId) item = hero.equips[k];
    } else {
        item = hero.bag.find(i=>i.id===itemId);
    }
    if(!item) return;
    let tooltip = document.getElementById('item-tooltip');
    if(!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'item-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = 9999;
        tooltip.style.background = '#222';
        tooltip.style.color = '#fff';
        tooltip.style.border = '1px solid #00aaff';
        tooltip.style.padding = '8px 14px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.fontSize = '13px';
        document.body.appendChild(tooltip);
    }
    tooltip.innerHTML = getItemDesc(item);
    tooltip.style.display = 'block';
    tooltip.style.left = (event.clientX+12)+'px';
    tooltip.style.top = (event.clientY+8)+'px';
};
window.hideItemTooltip = function() {
    const tooltip = document.getElementById('item-tooltip');
    if(tooltip) tooltip.style.display = 'none';
};

// 渲染角色属性到左侧面板
function renderHeroStats() {
    if (!hero) return;
    const { str, agi, int_, add } = getTotalHeroAttributes();
    // 计算攻击力（与战斗公式一致）
    let atk = 10;
    if (hero.mainAttr && hero.mainAttr.key === 'all') {
        atk += (str + agi + int_) * 0.6;
    } else if (hero.mainAttr && hero.mainAttr.key === 'str') {
        atk += str * 1;
    } else if (hero.mainAttr && hero.mainAttr.key === 'agi') {
        atk += agi * 1;
    } else if (hero.mainAttr && hero.mainAttr.key === 'int') {
        atk += int_ * 1;
    }
    atk += add.attack;
    atk = +(atk).toFixed(1);
    // 计算其他属性
    const maxHp = +(100 + str * 22 + add.maxHp).toFixed(1);
    const hpRegen = +(0.1 * str + add.hpRegen).toFixed(1);
    const armor = +(0.167 * agi + add.armor).toFixed(1);
    const magicResist = +(0.167 * int_ + add.magicResist).toFixed(1);
    const skillAmp = +(0.5 * int_ + add.skillAmp).toFixed(1);
    const atkSpeed = +((agi * 1 + add.attackspeed)).toFixed(1);
    // 三级属性
    const crit = +(add.critRate).toFixed(3), lifesteal = +(add.lifeSteal).toFixed(3), stun = +(add.stunChance).toFixed(3), evasion = +(add.evasion).toFixed(3), statusResist = +(add.statusResist).toFixed(3), cdr = +(add.cooldownReduction).toFixed(3), magicLifesteal = +(add.magicLifesteal).toFixed(3), dmgReduce = +(add.damageReduction).toFixed(3);

    const statsDiv = document.getElementById('player-stats');
    statsDiv.innerHTML = `
        <h2>角色属性</h2>
        <div><b>名称：</b>${hero.name}<span style="margin-left:80px"></span>主属性：${hero.mainAttrName}</div>
        <div><b>等级：</b>${hero.level}</div>
        <div><b>经验：</b>${hero.exp} &nbsp;&nbsp;离升级还差${getExpToLevelUp(hero.level)-hero.exp}点经验</div>
        <div><b>金币：</b>${hero.gold}<span style="margin-left:100px"></span>技能碎片：</b>${hero.skillShards}</div>
        <hr>
        <div style="color:#ff4d4d;"><b onmouseover=\"showAttrTooltip('str', event)\" onmouseout=\"hideAttrTooltip()\">力量：</b>${str.toFixed(1)} <span style='color:#aaa'>(成长：${Number(hero.growth.力量).toFixed(1)}/级)</span></div>
        <div style="color:#4dff4d;"><b onmouseover=\"showAttrTooltip('agi', event)\" onmouseout=\"hideAttrTooltip()\">敏捷：</b>${agi.toFixed(1)} <span style='color:#aaa'>(成长：${Number(hero.growth.敏捷).toFixed(1)}/级)</span></div>
        <div style="color:#4d8aff;"><b onmouseover=\"showAttrTooltip('int', event)\" onmouseout=\"hideAttrTooltip()\">智力：</b>${int_.toFixed(1)} <span style='color:#aaa'>(成长：${Number(hero.growth.智力).toFixed(1)}/级)</span></div>
        <hr>
        <div style="color:#ffd700;"><b>生命值：</b>${maxHp}<span style="margin-left:80px"></span>生命恢复速度：</b>${hpRegen}/秒</div>
        <div style="color:#ffd700;"><b>攻击力：</b>${atk}<span style="margin-left:89px"></span>攻击速度：</b>${atkSpeed}</div>
        <div style="color:#ffd700;"><b>护甲：</b>${armor}<span style="margin-left:100px"></span>魔法抗性：</b>${magicResist}</div>
        <hr>
        <div><b>技能增强：</b>${skillAmp}<span style="margin-left:96px"></span>冷却减缩：</b>${cdr}%</div>
        <div><b>暴击率：</b>${(crit*100).toFixed(1)}%<span style="margin-left:90px"></span>闪避率：</b>${(evasion*100).toFixed(1)}%</div>  
         <div><b>物理吸血率：</b>${(lifesteal*100).toFixed(1)}%<span style="margin-left:60px"></span>魔法吸血率：</b>${(magicLifesteal*100).toFixed(1)}%</div>
        <div><b>击晕率：</b>${(stun*100).toFixed(1)}%<span style="margin-left:90px"></span>状态抗性：</b>${(statusResist*100).toFixed(1)}%</div>
        <div><b>伤害减免率：</b>${(dmgReduce*100).toFixed(1)}%</div>
    `;
    // 渲染测试按钮
    if (typeof addTestBtns === 'function') addTestBtns();
}

// 渲染铁匠铺锻造按钮，修正字段名
function renderBlacksmith() {
    const wsDiv = document.getElementById('blacksmith');
    if (!workshop || workshop.length === 0) {
        wsDiv.innerHTML = '<h2>铁匠铺</h2><div style="color:#888">暂无锻造数据</div>';
        return;
    }
    let html = '<h2>铁匠铺</h2>';
    html += '<div style="margin-bottom:10px;">请选择锻造方式：</div>';
    workshop.forEach((row, idx) => {
        html += `<button class="forge-btn" id="forge-btn-${idx}" style="margin:0 10px 10px 0;">${row.name}</button>`;
    });
    html += '<div id="forge-tip" style="margin-top:12px;color:#aaa;"></div>';
    wsDiv.innerHTML = html;
    // 悬浮显示概率分布和金币消耗
    workshop.forEach((row, idx) => {
        const btn = document.getElementById(`forge-btn-${idx}`);
        btn.onmouseover = () => {
            let tip = '';
            const cost = row.goldCost || 0;
            tip += `<span style='color:#ffd700'>消耗金币：${cost}</span><br>`;
            tip += '稀有度概率：';
            for (let i = 1; i <= 6; i++) {
                const key = RARITY_MAP[i].key;
                if (row[key] !== undefined) tip += `<br>${RARITY_MAP[i].name}：${row[key]}%`;
            }
            document.getElementById('forge-tip').innerHTML = tip;
        };
        btn.onmouseout = () => {
            document.getElementById('forge-tip').innerHTML = '';
        };
    });
    bindForgeBtns();
}

// 页面加载数据后渲染铁匠铺
const oldLoadAllGameData = loadAllGameData;
loadAllGameData = async function() {
    await oldLoadAllGameData();
    renderBlacksmith();
};

// ====== 锻造相关工具函数 ======
function drawRare(row) {
    let total = 0;
    const arr = [];
    for (let i = 1; i <= 6; i++) {
        const key = RARITY_MAP[i].key;
        const p = Number(row[key] || 0);
        if (p > 0) arr.push({ num: i, p });
        total += p;
    }
    let rnd = Math.random() * total;
    for (const obj of arr) {
        if (rnd < obj.p) return obj.num;
        rnd -= obj.p;
    }
    return arr[0]?.num || 1;
}

function drawEquipLevel(heroLv) {
    const pool = [heroLv-2, heroLv-1, heroLv, heroLv+1];
    const idx = Math.floor(Math.random() * 4);
    return Math.max(1, pool[idx]);
}

function drawEquipPart() {
    return EQUIP_PARTS[Math.floor(Math.random() * EQUIP_PARTS.length)].id;
}

function getRandomItem(rareNum, level, part) {
    const pool = items.filter(e => {
        const r = Number(e.rarity);
        const l = Number(e.itemLv);
        const p = Number(e.part);
        return r === rareNum && l === level && p === part;
    });
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ====== 锻造主流程 ======
function doForge(idx) {
    if (!hero) return;
    const row = workshop[idx];
    const cost = Number(row.goldCost || 0);
    if (hero.gold < cost) {
        addGrowthLog(`<span style='color:#ff4d4d'>金币不足，无法锻造！</span>`);
        return;
    }
    hero.gold -= cost;
    // 1. 抽稀有度（数字）
    const rareNum = drawRare(row);
    // 2. 抽等级
    const lv = drawEquipLevel(hero.level);
    // 3. 抽部位
    const part = drawEquipPart();
    // 4. 从装备表中抽装备
    const item = getRandomItem(rareNum, lv, part);
    if (!item) {
        addGrowthLog(`<span style='color:#ff4d4d'>锻造失败：没有符合条件的装备！</span>`);
        return;
    }
    // 5. 生成唯一id，克隆对象
    const newItem = {
        ...item,
        id: Date.now() + Math.floor(Math.random() * 10000),
        itemId: item.itemId,
        part: Number(item.part),
        name: item.name,
        rarity: Number(item.rarity),
        itemLv: Number(item.itemLv)
    };
    hero.bag.push(newItem);
    const rareInfo = RARITY_MAP[newItem.rarity] || { name: '未知', color: '#fff' };
    addGrowthLog(`<span style='color:${rareInfo.color}'>锻造获得装备：${newItem.name}（${rareInfo.name}，Lv.${newItem.itemLv}，${EQUIP_PARTS.find(p => p.id === newItem.part)?.name || ''}）</span>`);
    renderBag();
    renderHeroStats();
    renderEquips();
}

// 按钮绑定锻造主流程
function bindForgeBtns() {
    if (!workshop) return;
    workshop.forEach((row, idx) => {
        const btn = document.getElementById(`forge-btn-${idx}`);
        if(btn) btn.onclick = () => doForge(idx);
    });
}

// 在中间面板底部插入测试按钮
function renderTestBtnsMiddle() {
    const btnsDiv = document.getElementById('test-btns-middle');
    if (!btnsDiv) return;
    btnsDiv.innerHTML = '';
    /*
    let btn1 = document.createElement('button');
    btn1.id = 'test-exp-btn-middle';
    btn1.textContent = '测试获得经验+50';
    btn1.style.marginRight = '18px';
    btn1.onclick = () => gainExp(50);
    btnsDiv.appendChild(btn1);
    let btn2 = document.createElement('button');
    btn2.id = 'test-gold-btn-middle';
    btn2.textContent = '测试获得金币+100';
    btn2.onclick = () => {
        hero.gold += 100;
        addGrowthLog('<span style="color:#ffd700">获得金币：+100</span>');
        renderHeroStats();
    };
    btnsDiv.appendChild(btn2);
    */
}

// ====== 关卡与怪物系统 ======
let selectedStageId = null;

// ====== 战斗系统核心实现 ======
let battleState = null; // 用于管理当前战斗状态
let battleCooldownTimer = null; // 休息冷却计时器

// 获取战斗已进行的秒数
function getBattleTimeSec() {
    if (!battleState || !battleState.startTime) return 0;
    return Math.floor((Date.now() - battleState.startTime) / 1000);
}

// 修改 startBattle，记录战斗开始时间
function startBattle() {
    if (!hero || !selectedStageId) return;
    if (battleCooldownTimer) {
        addCombatLog('<span style="color:#888">角色正在休息，无法战斗</span>');
        return;
    }
    const stage = stages.find(s => s.stageid === selectedStageId);
    const monster = monsters.find(m => m.monsterid === stage.monsterid);
    if (!monster) {
        addCombatLog('<span style="color:#f66">未找到怪物数据，无法战斗</span>');
        return;
    }
    // 统一属性计算
    const { str, agi, int_, add } = getTotalHeroAttributes();
    // 生命值
    const maxHp = 100 + str * 22 + add.maxHp;
    // 攻击力
    let atk = 10;
    if (hero.mainAttr && hero.mainAttr.key === 'all') {
        atk += (str + agi + int_) * 0.6;
    } else if (hero.mainAttr && hero.mainAttr.key === 'str') {
        atk += str * 1;
    } else if (hero.mainAttr && hero.mainAttr.key === 'agi') {
        atk += agi * 1;
    } else if (hero.mainAttr && hero.mainAttr.key === 'int') {
        atk += int_ * 1;
    }
    atk += add.attack;
    atk = +(atk).toFixed(1);
    const player = {
        name: hero.name,
        maxHp: maxHp,
        hp: maxHp,
        attack: atk,
        attackspeed: add.attackspeed + agi * 1,
        armor: add.armor + agi * 0.167,
        magicResist: add.magicResist + int_ * 0.167,
        critRate: add.critRate,
        evasion: add.evasion,
        stunChance: add.stunChance,
        hpRegen: add.hpRegen + str * 0.1,
        lifeSteal: add.lifeSteal,
        magicLifesteal: add.magicLifesteal,
        damageReduction: add.damageReduction,
        statusResist: add.statusResist,
        skillAmp: add.skillAmp + int_ * 0.5,
        cooldownReduction: add.cooldownReduction,
    };
    const enemy = JSON.parse(JSON.stringify(monster));
    enemy.hp = enemy.maxHp;
    battleState = {
        player, enemy,
        playerAttackTimer: null,
        enemyAttackTimer: null,
        playerSkillTimer: null,
        enemySkillTimer: null,
        inBattle: true,
        startTime: Date.now()
    };
    document.getElementById('start-battle-btn').disabled = true;
    addCombatLog(`<span style='color:#4d8aff'>战斗开始！${player.name} VS ${enemy.name}</span>`);
    schedulePlayerAttack();
    scheduleEnemyAttack();
}

function schedulePlayerAttack() {
    if (!battleState || !battleState.inBattle) return;
    let now = Date.now();
    let delay = 1500 / (1 + battleState.player.attackspeed / 100);
    if (battleState.playerStunUntil && now < battleState.playerStunUntil) {
        delay = battleState.playerStunUntil - now;
        battleState.playerStunUntil = null; // 只推迟一次
    }
    battleState.playerAttackTimer = setTimeout(() => {
        playerAttack();
        schedulePlayerAttack();
    }, delay);
}
function scheduleEnemyAttack() {
    if (!battleState || !battleState.inBattle) return;
    let now = Date.now();
    let delay = 1500 / (1 + battleState.enemy.attackspeed / 100);
    if (battleState.enemyStunUntil && now < battleState.enemyStunUntil) {
        delay = battleState.enemyStunUntil - now;
        battleState.enemyStunUntil = null; // 只推迟一次
    }
    battleState.enemyAttackTimer = setTimeout(() => {
        enemyAttack();
        scheduleEnemyAttack();
    }, delay);
}

// 修改 playerAttack 和 enemyAttack 日志
function playerAttack() {
    if (!battleState || !battleState.inBattle) return;
    const attacker = battleState.player;
    const defender = battleState.enemy;
    let isCrit = Math.random() < attacker.critRate;
    let isEvade = Math.random() < defender.evasion;
    let isStun = Math.random() < attacker.stunChance;
    let baseDmg = attacker.attack;
    let armorReduce = (0.052 * defender.armor) / (0.9 + 0.048 * Math.abs(defender.armor));
    armorReduce = Math.max(0, Math.min(armorReduce, 0.8));
    let dmg = baseDmg * (1 - armorReduce) * (1 - defender.damageReduction);
    let log = `<span style='color:#4d8aff'>玩家攻击，对${defender.name}`;
    if (isCrit) {
        dmg *= 2;
        log += `造成物理伤害<span style='color:#ff2222'>${dmg.toFixed(1)}</span>点（暴击）`;
    } else if (isEvade) {
        log += `的攻击被<span style='color:#2299ff'>闪避</span>了`;
        dmg = 0;
    } else {
        log += `造成物理伤害${dmg.toFixed(1)}点`;
    }
    if (isStun && !isEvade) {
        log += `，<span style='color:#ffd700'>击晕了</span>对方`;
        battleState.enemyStunUntil = Date.now() + 1000; // 怪物被晕1秒
    }
    // 物理吸血
    let heal = dmg * (attacker.lifeSteal || 0);
    if (heal > 0) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
        log += `，恢复${heal.toFixed(1)}点生命值`;
    }
    defender.hp -= dmg;
    log += `，${defender.name}还剩下${Math.max(0, defender.hp.toFixed(1))}点生命值`;
    log += '</span>';
    addCombatLog(log);
    checkBattleEnd();
}

function enemyAttack() {
    if (!battleState || !battleState.inBattle) return;
    const attacker = battleState.enemy;
    const defender = battleState.player;
    let isCrit = Math.random() < attacker.critRate;
    let isEvade = Math.random() < defender.evasion;
    let isStun = Math.random() < attacker.stunChance;
    let baseDmg = attacker.attack;
    let armorReduce = (0.052 * defender.armor) / (0.9 + 0.048 * Math.abs(defender.armor));
    armorReduce = Math.max(0, Math.min(armorReduce, 0.8));
    let dmg = baseDmg * (1 - armorReduce) * (1 - defender.damageReduction);
    let log = `<span style='color:#f66'>${attacker.name}攻击，对玩家`;
    if (isCrit) {
        dmg *= 2;
        log += `造成物理伤害<span style='color:#ff2222'>${dmg.toFixed(1)}</span>点（暴击）`;
    } else if (isEvade) {
        log += `的攻击被<span style='color:#2299ff'>闪避</span>了`;
        dmg = 0;
    } else {
        log += `造成物理伤害${dmg.toFixed(1)}点`;
    }
    if (isStun && !isEvade) {
        log += `，<span style='color:#ffd700'>击晕了</span>对方`;
        battleState.playerStunUntil = Date.now() + 1000; // 玩家被晕1秒
    }
    // 物理吸血
    let heal = dmg * (attacker.lifeSteal || 0);
    if (heal > 0) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
        log += `，恢复${heal.toFixed(1)}点生命值`;
    }
    defender.hp -= dmg;
    log += `，玩家还剩下${Math.max(0, defender.hp.toFixed(1))}点生命值`;
    log += '</span>';
    addCombatLog(log);
    checkBattleEnd();
}

function checkBattleEnd() {
    if (!battleState || !battleState.inBattle) return;
    if (battleState.player.hp <= 0) {
        endBattle('lose');
    } else if (battleState.enemy.hp <= 0) {
        endBattle('win');
    }
}

function endBattle(result) {
    battleState.inBattle = false;
    clearTimeout(battleState.playerAttackTimer);
    clearTimeout(battleState.enemyAttackTimer);
    // 结算
    if (result === 'win') {
        addCombatLog(`<span style='color:#4dff4d'>战斗胜利！获得奖励</span>`);
        // 发放奖励
        gainExp(battleState.enemy.expReward || 0);
        hero.gold += battleState.enemy.goldReward || 0;
        hero.skillShards += battleState.enemy.skillShardsReward || 0;
        renderHeroStats();
        addGrowthLog(`<span style='color:#ffd700'>获得经验：+${battleState.enemy.expReward||0}，金币：+${battleState.enemy.goldReward||0}，技能碎片：+${battleState.enemy.skillShardsReward||0}</span>`);
    } else {
        addCombatLog(`<span style='color:#ff4d4d'>战斗失败，角色需要休息5秒</span>`);
        // 进入冷却
        document.getElementById('start-battle-btn').disabled = true;
        let rest =5;
        battleCooldownTimer = setInterval(() => {
            rest--;
            document.getElementById('start-battle-btn').textContent = `休息中(${rest}s)`;
            if (rest <= 0) {
                clearInterval(battleCooldownTimer);
                battleCooldownTimer = null;
                document.getElementById('start-battle-btn').textContent = '开始战斗';
                document.getElementById('start-battle-btn').disabled = false;
            }
        }, 1000);
    }
    // 恢复按钮
    if (result === 'win') {
        document.getElementById('start-battle-btn').disabled = false;
    }
}

function addCombatLog(msg) {
    const logDiv = document.getElementById('combat-log');
    if (!logDiv) return;
    const entry = document.createElement('div');
    entry.innerHTML = msg;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
}

// 修改关卡下"开始战斗"按钮绑定
function renderStages() {
    const stagesDiv = document.getElementById('stages');
    if (!stages || stages.length === 0) {
        stagesDiv.innerHTML = '<div style="color:#888">暂无关卡数据</div>';
        return;
    }
    let html = '<div style="margin-bottom:16px;">';
    stages.forEach(stage => {
        html += `<button class="stage-btn${selectedStageId===stage.stageid?' selected':''}" data-stageid="${stage.stageid}" style="margin:0 10px 10px 0;padding:8px 20px;border-radius:6px;border:1px solid #444;cursor:pointer;${selectedStageId===stage.stageid?'background:#007acc;color:#fff;':''}">${stage.name}</button>`;
    });
    html += '</div>';
    html += `<button id="start-battle-btn" style="margin-top:18px;" ${selectedStageId ? '' : 'disabled'}>开始战斗</button>`;
    html += `<label style="margin-left:12px;"><input type="checkbox" id="auto-battle-checkbox"> 自动战斗</label>`;
    stagesDiv.innerHTML = html;

    // 绑定关卡按钮点击事件
    document.querySelectorAll('.stage-btn').forEach(item => {
        item.onclick = function() {
            selectedStageId = Number(this.getAttribute('data-stageid'));
            renderStages();
        };
    });
    // 绑定"开始战斗"按钮
    document.getElementById('start-battle-btn').onclick = function() {
        if (!selectedStageId) return;
        startBattle();
    };
    // 绑定自动战斗勾选框
    bindAutoBattleCheckbox && bindAutoBattleCheckbox();
}

function renderMonsterInfo() {
    const infoDiv = document.getElementById('monster-info');
    if (!selectedStageId) {
        infoDiv.innerHTML = '<div style="color:#888">请选择关卡</div>';
        return;
    }
    const stage = stages.find(s => s.stageid === selectedStageId);
    if (!stage) {
        infoDiv.innerHTML = '<div style="color:#f66">未找到该关卡数据</div>';
        return;
    }
    const monster = monsters.find(m => m.monsterid === stage.monsterid);
    if (!monster) {
        infoDiv.innerHTML = '<div style="color:#f66">未找到该关卡对应的怪物数据</div>';
        return;
    }
    let html = `<div><b>怪物名称：</b>${monster.name}</div>`;
    html += `<div><b>生命值：</b>${monster.maxHp}</div>`;
    html += `<div><b>攻击力：</b>${monster.attack}</div>`;
    html += `<div><b>攻击速度：</b>${monster.attackspeed}</div>`;
    html += `<div><b>护甲：</b>${monster.armor}</div>`;
    html += `<div><b>魔法抗性：</b>${monster.magicResist}</div>`;
    html += `<div><b>暴击率：</b>${(monster.critRate*100).toFixed(1)}%</div>`;
    html += `<div><b>闪避率：</b>${(monster.evasion*100).toFixed(1)}%</div>`;
    html += `<div><b>击晕率：</b>${(monster.stunChance*100).toFixed(1)}%</div>`;
    html += `<div><b>生命恢复：</b>${monster.hpRegen}/秒</div>`;
    html += `<div><b>技能增强：</b>${monster.skillAmp}</div>`;
    html += `<div><b>冷却减缩：</b>${monster.cooldownReduction}</div>`;
    html += `<div><b>物理吸血：</b>${monster.lifeSteal}</div>`;
    html += `<div><b>魔法吸血：</b>${monster.magicLifesteal}</div>`;
    html += `<div><b>状态抗性：</b>${monster.statusResist}</div>`;
    html += `<div><b>伤害减免：</b>${monster.damageReduction}</div>`;
    html += `<div><b>经验奖励：</b>${monster.expReward}</div>`;
    html += `<div><b>金币奖励：</b>${monster.goldReward}</div>`;
    html += `<div><b>技能碎片奖励：</b>${monster.skillShardsReward}</div>`;
    infoDiv.innerHTML = html;
}

// 页面加载数据后渲染关卡
const oldLoadAllGameData2 = loadAllGameData;
loadAllGameData = async function() {
    await oldLoadAllGameData2();
    renderStages();
};

// ====== 属性悬浮提示 ======
function showAttrTooltip(type, event) {
    if (!hero && type !== 'create') return;
    let mainAttr = hero ? hero.mainAttr : currentRoll.mainAttr;
    let isCreate = (type === 'create');
    let attrType = isCreate ? event : type; // 兼容创建角色时传参
    let html = '';
    if (attrType === 'str') {
        html = '每点力量+22生命值，+0.1生命恢复速度';
        if (mainAttr.key === 'str') {
            html += '<br>每点力量+1攻击力';
        } else if (mainAttr.key === 'all') {
            html += '<br>每点力量+0.6攻击力';
        }
    } else if (attrType === 'agi') {
        html = '每点敏捷+0.167护甲，+1攻击速度';
        if (mainAttr.key === 'agi') {
            html += '<br>每点敏捷+1攻击力';
        } else if (mainAttr.key === 'all') {
            html += '<br>每点敏捷+0.6攻击力';
        }
    } else if (attrType === 'int') {
        html = '每点智力+0.5技能增强，+0.167魔法抗性';
        if (mainAttr.key === 'int') {
            html += '<br>每点智力+1攻击力';
        } else if (mainAttr.key === 'all') {
            html += '<br>每点智力+0.6攻击力';
        }
    }
    let tooltip = document.getElementById('attr-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'attr-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = 9999;
        tooltip.style.background = '#222';
        tooltip.style.color = '#fff';
        tooltip.style.border = '1px solid #ffd700';
        tooltip.style.padding = '8px 14px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.fontSize = '13px';
        document.body.appendChild(tooltip);
    }
    tooltip.innerHTML = html;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.clientX+12)+'px';
    tooltip.style.top = (event.clientY+8)+'px';
}
window.hideAttrTooltip = function() {
    const tooltip = document.getElementById('attr-tooltip');
    if(tooltip) tooltip.style.display = 'none';
};

// ====== 自动挑战功能 ======
let autoBattle = false;

// 监听自动挑战勾选框
function bindAutoBattleCheckbox() {
    const checkbox = document.getElementById('auto-battle-checkbox');
    if (checkbox) {
        checkbox.onchange = function() {
            autoBattle = this.checked;
        };
    }
}

// 修改renderStages，每次渲染后绑定自动挑战勾选框
const oldRenderStages = renderStages;
renderStages = function() {
    oldRenderStages();
    bindAutoBattleCheckbox();
};

// 修改endBattle，胜利后如autoBattle为true则自动再次挑战
const oldEndBattle = endBattle;
endBattle = function(result) {
    oldEndBattle(result);
    if (result === 'win' && autoBattle && selectedStageId && (!battleCooldownTimer)) {
        setTimeout(() => {
            startBattle();
        }, 600); // 间隔0.6秒再挑战，避免刷屏
    }
}; 