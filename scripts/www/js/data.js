/* ============================================================
   单词花园 · 数据层
   词库 / 种子 / 道具 / 商品 / 三条成长线等级表 / 任务 / 好友
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 词库原始数据：单词|音标|释义|例句 ---------- */
  const RAW = {
    primary: `apple|ˈæpl|n. 苹果|An apple a day keeps the doctor away.
banana|bəˈnɑːnə|n. 香蕉|The monkey is eating a banana.
orange|ˈɒrɪndʒ|n. 橙子；橙色|Would you like some orange juice?
pear|peə|n. 梨|This pear is sweet and juicy.
grape|ɡreɪp|n. 葡萄|My grandmother grows grapes in the yard.
watermelon|ˈwɔːtəmelən|n. 西瓜|We eat watermelon in summer.
strawberry|ˈstrɔːbəri|n. 草莓|She picked a red strawberry.
bread|bred|n. 面包|I have bread and milk for breakfast.
milk|mɪlk|n. 牛奶|Drink a glass of milk every morning.
water|ˈwɔːtə|n. 水|Please give me a cup of water.
egg|eɡ|n. 鸡蛋|My mother cooks an egg for me.
rice|raɪs|n. 米饭；大米|We have rice for dinner.
cake|keɪk|n. 蛋糕|Today is my birthday and we eat cake.
candy|ˈkændi|n. 糖果|The little boy likes candy very much.
dog|dɒɡ|n. 狗|My dog can run very fast.
cat|kæt|n. 猫|The cat is sleeping under the chair.
bird|bɜːd|n. 鸟|A bird is singing in the tree.
fish|fɪʃ|n. 鱼|There are many fish in the river.
rabbit|ˈræbɪt|n. 兔子|The rabbit has two long ears.
panda|ˈpændə|n. 熊猫|The panda is eating bamboo.
tiger|ˈtaɪɡə|n. 老虎|The tiger is a big and strong animal.
monkey|ˈmʌŋki|n. 猴子|Monkeys like bananas.
elephant|ˈelɪfənt|n. 大象|The elephant has a long nose.
school|skuːl|n. 学校|Our school is very beautiful.
teacher|ˈtiːtʃə|n. 老师|My teacher is kind to us.
student|ˈstjuːdnt|n. 学生|He is a good student.
book|bʊk|n. 书|This book is very interesting.
pencil|ˈpensl|n. 铅笔|I write with a pencil.
ruler|ˈruːlə|n. 尺子|Can I borrow your ruler?
bag|bæɡ|n. 书包；袋子|My bag is full of books.
desk|desk|n. 书桌|There is a lamp on the desk.
chair|tʃeə|n. 椅子|Please sit on the chair.
window|ˈwɪndəʊ|n. 窗户|Open the window, please.
door|dɔː|n. 门|Please close the door.
family|ˈfæməli|n. 家庭|I love my family.
father|ˈfɑːðə|n. 父亲|My father works in a hospital.
mother|ˈmʌðə|n. 母亲|My mother is a teacher.
brother|ˈbrʌðə|n. 兄弟|My brother is taller than me.
sister|ˈsɪstə|n. 姐妹|She is my little sister.
friend|frend|n. 朋友|You are my best friend.
happy|ˈhæpi|adj. 快乐的|I am happy to see you.
sad|sæd|adj. 难过的|Why do you look so sad?
big|bɪɡ|adj. 大的|The apple is big and red.
small|smɔːl|adj. 小的|The cat is small and cute.
red|red|adj. 红色的|She is wearing a red dress.
blue|bluː|adj. 蓝色的|The sky is blue today.
green|ɡriːn|adj. 绿色的|The leaves are green in spring.
yellow|ˈjeləʊ|adj. 黄色的|The banana is yellow.
run|rʌn|v. 跑|He can run very fast.
jump|dʒʌmp|v. 跳|The frog can jump high.
swim|swɪm|v. 游泳|I swim in the pool every summer.
sing|sɪŋ|v. 唱歌|She likes to sing English songs.
dance|dɑːns|v. 跳舞|They dance together happily.
read|riːd|v. 阅读|I read a story before bed.
write|raɪt|v. 写|Please write your name here.
morning|ˈmɔːnɪŋ|n. 早晨|I get up at six in the morning.
night|naɪt|n. 夜晚|The moon is bright at night.
sunny|ˈsʌni|adj. 晴朗的|It is a sunny day today.
rainy|ˈreɪni|adj. 下雨的|Take an umbrella on a rainy day.`,

    junior: `ability|əˈbɪləti|n. 能力|He has the ability to solve the problem.
accept|əkˈsept|v. 接受|Please accept my invitation.
achieve|əˈtʃiːv|v. 实现；达到|You can achieve your dream with hard work.
advice|ədˈvaɪs|n. 建议|My teacher gave me some useful advice.
afford|əˈfɔːd|v. 负担得起|We cannot afford a new car.
agree|əˈɡriː|v. 同意|I agree with your idea.
allow|əˈlaʊ|v. 允许|My parents allow me to play after homework.
appear|əˈpɪə|v. 出现；显得|A rainbow appeared in the sky.
argue|ˈɑːɡjuː|v. 争论|They often argue about small things.
attend|əˈtend|v. 出席；参加|I attend the meeting every Monday.
avoid|əˈvɔɪd|v. 避免|Try to avoid making the same mistake.
balance|ˈbæləns|n. 平衡；v. 平衡|Keep a balance between study and rest.
believe|bɪˈliːv|v. 相信|I believe you can do it well.
borrow|ˈbɒrəʊ|v. 借入|May I borrow your dictionary?
brave|breɪv|adj. 勇敢的|The brave boy saved the cat.
breathe|briːð|v. 呼吸|Breathe deeply and relax.
careful|ˈkeəfl|adj. 仔细的|Be careful when crossing the road.
celebrate|ˈselɪbreɪt|v. 庆祝|We celebrate the festival with our family.
challenge|ˈtʃælɪndʒ|n. 挑战|This job is a big challenge for me.
choose|tʃuːz|v. 选择|You can choose any book you like.
compare|kəmˈpeə|v. 比较|Do not compare yourself with others.
complete|kəmˈpliːt|v. 完成；adj. 完整的|Please complete the task on time.
consider|kənˈsɪdə|v. 考虑|We should consider the cost first.
continue|kənˈtɪnjuː|v. 继续|Let us continue our discussion.
courage|ˈkʌrɪdʒ|n. 勇气|It takes courage to tell the truth.
decide|dɪˈsaɪd|v. 决定|I decide to study harder this term.
describe|dɪˈskraɪb|v. 描述|Can you describe the picture?
develop|dɪˈveləp|v. 发展；培养|Reading helps develop your mind.
discover|dɪˈskʌvə|v. 发现|Scientists discovered a new planet.
discuss|dɪˈskʌs|v. 讨论|Let us discuss the plan together.
encourage|ɪnˈkʌrɪdʒ|v. 鼓励|My teacher encouraged me to try again.
environment|ɪnˈvaɪrənmənt|n. 环境|We should protect the environment.
expect|ɪkˈspekt|v. 期待；预料|I expect to hear from you soon.
experience|ɪkˈspɪəriəns|n. 经验；经历|Travel gives you valuable experience.
explain|ɪkˈspleɪn|v. 解释|He explained the rule to us clearly.
express|ɪkˈspres|v. 表达|She expressed her thanks in a letter.
familiar|fəˈmɪliə|adj. 熟悉的|This song sounds familiar to me.
forget|fəˈɡet|v. 忘记|Do not forget to bring your homework.
improve|ɪmˈpruːv|v. 提高；改善|Practice every day to improve your English.
include|ɪnˈkluːd|v. 包括|The price includes breakfast.
invent|ɪnˈvent|v. 发明|Edison invented the light bulb.
knowledge|ˈnɒlɪdʒ|n. 知识|Knowledge is power.
language|ˈlæŋɡwɪdʒ|n. 语言|English is a useful language.
mistake|mɪˈsteɪk|n. 错误|Everyone makes mistakes sometimes.
notice|ˈnəʊtɪs|v. 注意到；n. 通知|I noticed a small change in his face.
practice|ˈpræktɪs|n. 练习|Practice makes perfect.
prepare|prɪˈpeə|v. 准备|We are preparing for the exam.
protect|prəˈtekt|v. 保护|We must protect wild animals.
realize|ˈriːəlaɪz|v. 意识到|I realized that I was wrong.
receive|rɪˈsiːv|v. 收到|I received a letter yesterday.
remember|rɪˈmembə|v. 记得|I remember meeting him before.
suggest|səˈdʒest|v. 建议|I suggest that we start early.
support|səˈpɔːt|v. 支持|My family always supports me.
understand|ˌʌndəˈstænd|v. 理解|I understand what you mean.
volunteer|ˌvɒlənˈtɪə|n. 志愿者|She works as a volunteer in the museum.
wonder|ˈwʌndə|v. 想知道|I wonder why he is late.`,

    senior: `abandon|əˈbændən|v. 放弃；抛弃|They had to abandon the plan.
absolute|ˈæbsəluːt|adj. 绝对的|I have absolute trust in you.
abstract|ˈæbstrækt|adj. 抽象的|The idea is too abstract for children.
academic|ˌækəˈdemɪk|adj. 学术的|His academic performance is excellent.
accompany|əˈkʌmpəni|v. 陪伴；伴随|She accompanied her mother to the hospital.
accomplish|əˈkʌmplɪʃ|v. 完成；实现|We accomplished the task ahead of time.
accurate|ˈækjərət|adj. 准确的|The data is accurate and reliable.
adjust|əˈdʒʌst|v. 调整|Please adjust the volume of the radio.
admit|ədˈmɪt|v. 承认；准许进入|He admitted that he had made a mistake.
adopt|əˈdɒpt|v. 采用；收养|The school adopted a new teaching method.
advocate|ˈædvəkeɪt|v. 提倡|Many experts advocate a healthy diet.
alternative|ɔːlˈtɜːnətɪv|n. 替代方案|We need an alternative plan.
ambiguous|æmˈbɪɡjuəs|adj. 模棱两可的|His answer was rather ambiguous.
analyze|ˈænəlaɪz|v. 分析|Let us analyze the causes of the failure.
ancient|ˈeɪnʃənt|adj. 古代的|We visited an ancient temple.
announce|əˈnaʊns|v. 宣布|The school announced the result today.
anxiety|æŋˈzaɪəti|n. 焦虑|Exams often cause anxiety among students.
apparent|əˈpærənt|adj. 明显的|It was apparent that she was tired.
appeal|əˈpiːl|v. 呼吁；吸引|The charity appealed for donations.
appreciate|əˈpriːʃieɪt|v. 感激；欣赏|I really appreciate your help.
approach|əˈprəʊtʃ|n. 方法；v. 接近|We need a new approach to this problem.
appropriate|əˈprəʊpriət|adj. 合适的|Please wear appropriate clothes for the party.
approve|əˈpruːv|v. 批准；赞成|The manager approved my proposal.
assess|əˈses|v. 评估|Teachers assess students' progress each term.
assume|əˈsjuːm|v. 假定；认为|I assume that you have read the book.
attitude|ˈætɪtjuːd|n. 态度|A positive attitude helps a lot.
authority|ɔːˈθɒrəti|n. 权威；当局|The local authority is in charge of the park.
available|əˈveɪləbl|adj. 可获得的；有空的|Tickets are available at the door.
aware|əˈweə|adj. 意识到的|Are you aware of the risk?
benefit|ˈbenɪfɪt|n. 益处|Exercise brings many benefits.
capable|ˈkeɪpəbl|adj. 有能力的|She is capable of doing the job well.
commit|kəˈmɪt|v. 承诺；犯（错）|He committed himself to the project.
complex|ˈkɒmpleks|adj. 复杂的|This is a complex social problem.
conclusion|kənˈkluːʒn|n. 结论|We came to the same conclusion.
confident|ˈkɒnfɪdənt|adj. 自信的|Be confident when you speak in public.
consequence|ˈkɒnsɪkwəns|n. 后果|Every choice has its consequences.
constant|ˈkɒnstənt|adj. 不断的；恒定的|The machine needs constant attention.
contribute|kənˈtrɪbjuːt|v. 贡献；促成|Everyone can contribute to the team.
convince|kənˈvɪns|v. 说服；使确信|He convinced me to join the club.
crucial|ˈkruːʃl|adj. 关键的|Sleep is crucial for good health.
declare|dɪˈkleə|v. 宣布；声明|The government declared a holiday.
define|dɪˈfaɪn|v. 定义|Can you define this word in English?
demonstrate|ˈdemənstreɪt|v. 证明；演示|The experiment demonstrates his theory.
deny|dɪˈnaɪ|v. 否认；拒绝|He denied breaking the window.
determine|dɪˈtɜːmɪn|v. 决定；确定|Hard work determines your future.
distinguish|dɪˈstɪŋɡwɪʃ|v. 区分|Can you distinguish the two colors?
efficient|ɪˈfɪʃnt|adj. 高效的|This is an efficient way to learn words.
emerge|ɪˈmɜːdʒ|v. 出现；浮现|The sun emerged from behind the clouds.
emphasize|ˈemfəsaɪz|v. 强调|The teacher emphasized the importance of reading.
enable|ɪˈneɪbl|v. 使能够|Practice enables you to speak fluently.
establish|ɪˈstæblɪʃ|v. 建立|The company was established in 1998.`,

    cet4: `absorb|əbˈzɔːb|v. 吸收；使全神贯注|Plants absorb carbon dioxide from the air.
abundant|əˈbʌndənt|adj. 丰富的|The region has abundant natural resources.
accelerate|əkˈseləreɪt|v. 加速|The car accelerated smoothly.
access|ˈækses|n. 通道；v. 访问|Students have free access to the library.
accommodate|əˈkɒmədeɪt|v. 容纳；提供住宿|The hall can accommodate 500 people.
accumulate|əˈkjuːmjəleɪt|v. 积累|Dust had accumulated on the shelves.
acknowledge|əkˈnɒlɪdʒ|v. 承认；致谢|He acknowledged his mistake at once.
acquire|əˈkwaɪə|v. 获得；习得|Children acquire language quickly.
adapt|əˈdæpt|v. 适应；改编|It takes time to adapt to a new city.
adequate|ˈædɪkwət|adj. 足够的|Make sure you get adequate sleep.
administration|ədˌmɪnɪˈstreɪʃn|n. 管理；行政|He works in the administration office.
affect|əˈfekt|v. 影响|Smoking affects your health.
aggressive|əˈɡresɪv|adj. 好斗的；激进的|Aggressive driving causes accidents.
alternative|ɔːlˈtɜːnətɪv|n. 替代方案|There is no alternative but to wait.
ambition|æmˈbɪʃn|n. 雄心；抱负|Her ambition is to become a doctor.
amount|əˈmaʊnt|n. 数量|A large amount of money was spent.
annual|ˈænjuəl|adj. 年度的|The annual meeting will be held in May.
anticipate|ænˈtɪsɪpeɪt|v. 预期|We anticipate a rise in prices.
apparent|əˈpærənt|adj. 明显的|It was apparent that he was nervous.
apply|əˈplaɪ|v. 申请；应用|She applied for a job in the bank.
appoint|əˈpɔɪnt|v. 任命|He was appointed as the new manager.
appreciate|əˈpriːʃieɪt|v. 欣赏；感激|We appreciate your support very much.
arbitrary|ˈɑːbɪtrəri|adj. 任意的；专断的|The decision seemed completely arbitrary.
assemble|əˈsembl|v. 集合；组装|The workers assembled the machine quickly.
assign|əˈsaɪn|v. 分配；指派|The teacher assigned us a new task.
assist|əˈsɪst|v. 帮助|The nurse assisted the doctor in the operation.
associate|əˈsəʊʃieɪt|v. 关联|People often associate red with luck.
assume|əˈsjuːm|v. 假定|Let us assume that the story is true.
attach|əˈtætʃ|v. 附上；系上|Please attach your photo to the form.
attain|əˈteɪn|v. 达到；获得|She attained her goal after years of effort.
attempt|əˈtempt|v. 尝试|He attempted to climb the mountain.
attribute|əˈtrɪbjuːt|v. 归因于|She attributes her success to hard work.
authority|ɔːˈθɒrəti|n. 权威；权力|The police have the authority to stop cars.
automatic|ˌɔːtəˈmætɪk|adj. 自动的|The doors are fully automatic.
available|əˈveɪləbl|adj. 可用的|The room is available from Monday.
awkward|ˈɔːkwəd|adj. 尴尬的；笨拙的|There was an awkward silence in the room.
balance|ˈbæləns|n. 平衡|It is hard to keep a work-life balance.
bargain|ˈbɑːɡən|n. 便宜货；v. 讨价还价|This coat is a real bargain.
barrier|ˈbæriə|n. 障碍；屏障|Language can be a barrier to communication.
behave|bɪˈheɪv|v. 表现；举止|The children behaved well at the party.
boundary|ˈbaʊndri|n. 边界|The river forms the boundary between the two cities.
brief|briːf|adj. 简短的|Please give a brief introduction of yourself.
brilliant|ˈbrɪliənt|adj. 杰出的；明亮的|She came up with a brilliant idea.
budget|ˈbʌdʒɪt|n. 预算|We must keep the project within budget.
calculate|ˈkælkjuleɪt|v. 计算|Please calculate the total cost.
campaign|kæmˈpeɪn|n. 运动；活动|They launched a campaign to protect wildlife.
candidate|ˈkændɪdət|n. 候选人|There are five candidates for the position.
capacity|kəˈpæsəti|n. 容量；能力|The stadium has a capacity of 60,000.
category|ˈkætəɡəri|n. 类别|These books fall into three categories.`,

    cet6: `abolish|əˈbɒlɪʃ|v. 废除|The old law was abolished last year.
abrupt|əˈbrʌpt|adj. 突然的；生硬的|The meeting came to an abrupt end.
absurd|əbˈsɜːd|adj. 荒谬的|It is absurd to blame the weather.
accommodate|əˈkɒmədeɪt|v. 容纳；适应|The hotel can accommodate 300 guests.
accumulate|əˈkjuːmjəleɪt|v. 积累|He accumulated a large fortune.
acute|əˈkjuːt|adj. 敏锐的；急性的|She has an acute sense of smell.
adhere|ədˈhɪə|v. 坚持；粘附|We should adhere to the original plan.
advocate|ˈædvəkeɪt|v. 提倡|The report advocates stricter rules.
aesthetic|iːsˈθetɪk|adj. 审美的|The building has great aesthetic value.
alleviate|əˈliːvieɪt|v. 减轻|The medicine helped alleviate the pain.
ambiguous|æmˈbɪɡjuəs|adj. 模糊的|The contract contains ambiguous terms.
amend|əˈmend|v. 修订|The committee voted to amend the rule.
analogy|əˈnælədʒi|n. 类比|He drew an analogy between the heart and a pump.
anonymous|əˈnɒnɪməs|adj. 匿名的|The donation was made by an anonymous person.
anticipate|ænˈtɪsɪpeɪt|v. 预期|We anticipate strong demand this year.
apparatus|ˌæpəˈreɪtəs|n. 器械；装置|The laboratory apparatus is expensive.
arbitrary|ˈɑːbɪtrəri|adj. 任意的|The rule seems arbitrary and unfair.
articulate|ɑːˈtɪkjəleɪt|v. 清晰表达|She articulated her views clearly.
ascertain|ˌæsəˈteɪn|v. 查明|Police are trying to ascertain the facts.
aspire|əˈspaɪə|v. 渴望；立志|Many young people aspire to be writers.
assert|əˈsɜːt|v. 断言；维护|He asserted that he was innocent.
asset|ˈæset|n. 资产；宝贵的人或物|Good health is a great asset.
attribute|əˈtrɪbjuːt|v. 归因于|He attributes his success to good luck.
audacious|ɔːˈdeɪʃəs|adj. 大胆的|It was an audacious plan.
authentic|ɔːˈθentɪk|adj. 真实的；可信的|This is an authentic Italian restaurant.
autonomy|ɔːˈtɒnəmi|n. 自治；自主权|The region enjoys a high degree of autonomy.
benign|bɪˈnaɪn|adj. 良性的；温和的|The tumor turned out to be benign.
bewilder|bɪˈwɪldə|v. 使困惑|The complicated rules bewildered the visitors.
bizarre|bɪˈzɑː|adj. 离奇的|He told us a bizarre story.
blunt|blʌnt|adj. 直率的；钝的|To be blunt, your plan will not work.
boost|buːst|v. 促进；提高|The policy aims to boost employment.
breach|briːtʃ|n. 违反；缺口|The company was accused of a breach of contract.
brittle|ˈbrɪtl|adj. 易碎的|The old paper has become brittle.
bulk|bʌlk|n. 大量；主体|The bulk of the work has been finished.
bureaucracy|bjʊəˈrɒkrəsi|n. 官僚体制|Too much bureaucracy slows things down.
cascade|kæˈskeɪd|v. 倾泻；n. 瀑布|Water cascaded down the rocks.
cater|ˈkeɪtə|v. 迎合；提供饮食|The hotel caters for large events.
cease|siːs|v. 停止|The factory ceased production in June.
coherent|kəʊˈhɪərənt|adj. 连贯的|Please write a coherent paragraph.
compel|kəmˈpel|v. 迫使|Bad weather compelled us to stay indoors.`,

    kaoyan: `abstract|ˈæbstrækt|adj. 抽象的|Abstract concepts are hard to explain.
absurd|əbˈsɜːd|adj. 荒谬的|The idea sounds absurd but may be true.
abundant|əˈbʌndənt|adj. 丰富的|The area is abundant in wild plants.
accelerate|əkˈseləreɪt|v. 加速|Reforms accelerated economic growth.
accessory|əkˈsesəri|n. 配件；附件|These accessories are sold separately.
acclaim|əˈkleɪm|v. 称赞|The novel was widely acclaimed.
accommodate|əˈkɒmədeɪt|v. 适应；容纳|The system can accommodate new users.
accompany|əˈkʌmpəni|v. 伴随|Economic growth is accompanied by risks.
accumulate|əˈkjuːmjəleɪt|v. 积累|Capital accumulated rapidly in the city.
accuse|əˈkjuːz|v. 指控|He was accused of cheating.
acknowledge|əkˈnɒlɪdʒ|v. 承认|She acknowledged the importance of the issue.
acquire|əˈkwaɪə|v. 获得|Children acquire habits from their parents.
acute|əˈkjuːt|adj. 严重的；敏锐的|The country faces an acute shortage of water.
adapt|əˈdæpt|v. 适应|Species must adapt to a changing climate.
adequate|ˈædɪkwət|adj. 足够的|The supply is adequate for the winter.
adjacent|əˈdʒeɪsnt|adj. 邻近的|The school is adjacent to the park.
administer|ədˈmɪnɪstə|v. 管理；执行|The fund is administered by a committee.
adopt|əˈdɒpt|v. 采用|Many firms adopted the new standard.
advent|ˈædvent|n. 出现；到来|The advent of the internet changed everything.
adverse|ˈædvɜːs|adj. 不利的|Adverse weather delayed the flight.
advocate|ˈædvəkeɪt|v. 提倡|Scholars advocate a more flexible policy.
aesthetic|iːsˈθetɪk|adj. 美学的|The design has both aesthetic and practical value.
affiliate|əˈfɪlieɪt|v. 使隶属于|The hospital is affiliated with a university.
affirm|əˈfɜːm|v. 断言；肯定|The court affirmed the original decision.
aggregate|ˈæɡrɪɡət|n. 总量|The aggregate demand grew steadily.
aggravate|ˈæɡrəveɪt|v. 加剧|Dust can aggravate the disease.
alleviate|əˈliːvieɪt|v. 缓解|The new policy aims to alleviate poverty.
allocate|ˈæləkeɪt|v. 分配|More funds were allocated to education.
alter|ˈɔːltə|v. 改变|The internet has altered our lives.
ample|ˈæmpl|adj. 充足的|There is ample evidence to support the theory.
analogy|əˈnælədʒi|n. 类比|The teacher explained it by analogy.
anonymous|əˈnɒnɪməs|adj. 匿名的|An anonymous letter arrived yesterday.
anticipate|ænˈtɪsɪpeɪt|v. 预料|We anticipate that prices will rise.
appraisal|əˈpreɪzl|n. 评估|The project needs a careful appraisal.
arbitrary|ˈɑːbɪtrəri|adj. 任意的|The decision was arbitrary and unfair.
articulate|ɑːˈtɪkjəleɪt|v. 清晰表达|He articulated the group's concerns.
ascend|əˈsend|v. 上升|The path ascends steeply to the top.
aspire|əˈspaɪə|v. 立志|She aspires to become a researcher.
assert|əˈsɜːt|v. 断言|The author asserts that the data is reliable.
assess|əˈses|v. 评估|It is difficult to assess the damage.
asset|ˈæset|n. 资产|Human capital is a key asset.
assign|əˈsaɪn|v. 分配|The task was assigned to a small team.
assume|əˈsjuːm|v. 假定|We assume that demand will remain stable.
assure|əˈʃʊə|v. 保证|The manager assured us of full support.
attach|əˈtætʃ|v. 附加|Please attach the file to your email.
attain|əˈteɪn|v. 达到|Few countries attain this level of growth.
attribute|əˈtrɪbjuːt|v. 归因于|He attributes his success to teamwork.
authentic|ɔːˈθentɪk|adj. 真实的|The museum displays authentic artifacts.
authority|ɔːˈθɒrəti|n. 权威|The theory is accepted by most authorities.
automatic|ˌɔːtəˈmætɪk|adj. 自动的|The process is almost fully automatic.
auxiliary|ɔːɡˈzɪliəri|adj. 辅助的|Auxiliary power was used during the outage.`,

    ielts: `academic|ˌækəˈdemɪk|adj. 学术的|Academic writing requires formal language.
accommodation|əˌkɒməˈdeɪʃn|n. 住宿|Student accommodation is expensive in this city.
acquisition|ˌækwɪˈzɪʃn|n. 获得；收购|Language acquisition takes time.
adaptation|ˌædæpˈteɪʃn|n. 适应；改编|Climate adaptation is a global issue.
adequate|ˈædɪkwət|adj. 足够的|Adequate funding is essential for research.
advocate|ˈædvəkeɪt|v. 提倡|Many scientists advocate reducing waste.
agriculture|ˈæɡrɪkʌltʃə|n. 农业|Agriculture remains the main industry here.
allocate|ˈæləkeɪt|v. 分配|The council allocated funds for parks.
ambiguous|æmˈbɪɡjuəs|adj. 模糊的|The results of the study are ambiguous.
analyse|ˈænəlaɪz|v. 分析|The report analyses recent trends.
annual|ˈænjuəl|adj. 每年的|The annual rainfall is quite low.
anticipate|ænˈtɪsɪpeɪt|v. 预期|Experts anticipate a rise in sea levels.
apparent|əˈpærənt|adj. 明显的|It is apparent that demand is increasing.
assess|əˈses|v. 评估|Researchers assess the impact of tourism.
assumption|əˈsʌmpʃn|n. 假设|The argument rests on a false assumption.
attitude|ˈætɪtjuːd|n. 态度|Public attitudes towards recycling have changed.
authority|ɔːˈθɒrəti|n. 当局；权威|The local authority funded the project.
benefit|ˈbenɪfɪt|n. 益处|The benefits of exercise are well known.
biodiversity|ˌbaɪəʊdaɪˈvɜːsəti|n. 生物多样性|The island is rich in biodiversity.
capacity|kəˈpæsəti|n. 容量；能力|The factory has a capacity of 200 units a day.
carbon|ˈkɑːbən|n. 碳|Reducing carbon emissions is urgent.
circumstance|ˈsɜːkəmstəns|n. 情况|Under no circumstances should you give up.
climate|ˈklaɪmət|n. 气候|The climate here is mild all year round.
community|kəˈmjuːnəti|n. 社区|The whole community joined the clean-up.
compensate|ˈkɒmpenseɪt|v. 补偿|Farmers were compensated for their losses.
complex|ˈkɒmpleks|adj. 复杂的|Poverty is a complex social problem.
conclude|kənˈkluːd|v. 得出结论|The study concluded that the policy worked.
conserve|kənˈsɜːv|v. 保护；节约|We must conserve water in dry seasons.
considerable|kənˈsɪdərəbl|adj. 相当大的|The project required considerable effort.
constraint|kənˈstreɪnt|n. 限制|Time constraints affected the design.
consume|kənˈsjuːm|v. 消耗|Modern cities consume huge amounts of energy.
contribute|kənˈtrɪbjuːt|v. 促成；贡献|Tourism contributes greatly to the local economy.
controversial|ˌkɒntrəˈvɜːʃl|adj. 有争议的|The decision remains highly controversial.
convert|kənˈvɜːt|v. 转换|The old factory was converted into a museum.
crucial|ˈkruːʃl|adj. 关键的|Early education is crucial for children.
cultivate|ˈkʌltɪveɪt|v. 耕种；培养|Farmers cultivate rice in this region.
currency|ˈkʌrənsi|n. 货币|The local currency is quite stable.
decline|dɪˈklaɪn|v. 下降；n. 衰退|Fish populations have declined sharply.
demonstrate|ˈdemənstreɪt|v. 证明；展示|The experiment demonstrates the effect clearly.
dense|dens|adj. 密集的|The city has a dense population.`,

    toefl: `abstract|ˈæbstrækt|adj. 抽象的|Abstract art is not easy to understand.
academic|ˌækəˈdemɪk|adj. 学术的|Academic standards are very high here.
accumulate|əˈkjuːmjəleɪt|v. 积累|Sediment accumulated over millions of years.
accurate|ˈækjərət|adj. 准确的|The map is an accurate representation of the coast.
adapt|əˈdæpt|v. 适应|Animals adapt to their environment in many ways.
adjacent|əˈdʒeɪsnt|adj. 邻近的|The lab is adjacent to the library.
advocate|ˈædvəkeɪt|v. 提倡|The author advocates a return to traditional methods.
aesthetic|iːsˈθetɪk|adj. 审美的|The building has little aesthetic appeal.
allocate|ˈæləkeɪt|v. 分配|Resources were allocated according to need.
alter|ˈɔːltə|v. 改变|Human activity has altered the landscape.
ambient|ˈæmbiənt|adj. 周围的|Ambient temperature affects the experiment.
analyze|ˈænəlaɪz|v. 分析|Researchers analyze the samples in the lab.
ancient|ˈeɪnʃənt|adj. 古代的|Ancient civilizations built these structures.
annual|ˈænjuəl|adj. 每年的|The annual migration attracts many visitors.
apparent|əˈpærənt|adj. 明显的|The cause of the decline is not apparent.
approximate|əˈprɒksɪmət|adj. 大概的|The approximate age of the fossil is 10,000 years.
arbitrary|ˈɑːbɪtrəri|adj. 任意的|The classification seems somewhat arbitrary.
assess|əˈses|v. 评估|Scientists assess the risk of the new technology.
assume|əˈsjuːm|v. 假定|We assume that the climate was warmer then.
atmosphere|ˈætməsfɪə|n. 大气；气氛|The atmosphere protects the earth from radiation.
attribute|əˈtrɪbjuːt|v. 归因于|The decline is attributed to habitat loss.
authority|ɔːˈθɒrəti|n. 权威|The theory challenged the authority of the old model.
available|əˈveɪləbl|adj. 可获得的|Only limited data are available.
beneficial|ˌbenɪˈfɪʃl|adj. 有益的|Moderate exercise is beneficial to health.
capable|ˈkeɪpəbl|adj. 有能力的|The species is capable of surviving in extreme cold.
cease|siːs|v. 停止|The volcano ceased erupting after a week.
chemical|ˈkemɪkl|n. 化学物质|The chemical reacts with water.
circumstance|ˈsɜːkəmstəns|n. 情况|Under these circumstances, migration is likely.
civilization|ˌsɪvəlaɪˈzeɪʃn|n. 文明|The civilization flourished for centuries.
classic|ˈklæsɪk|adj. 经典的|This is a classic example of adaptation.
coherent|kəʊˈhɪərənt|adj. 连贯的|The argument is clear and coherent.
coincide|ˌkəʊɪnˈsaɪd|v. 同时发生|The two events coincided by chance.
collapse|kəˈlæps|v. 倒塌；崩溃|The bridge collapsed during the storm.
commodity|kəˈmɒdəti|n. 商品|Grain was an important commodity in trade.
compensate|ˈkɒmpenseɪt|v. 补偿|The body compensates for the loss of water.
compile|kəmˈpaɪl|v. 汇编|They compiled a list of endangered species.
component|kəmˈpəʊnənt|n. 组成部分|Each component of the system was tested.
comprehensive|ˌkɒmprɪˈhensɪv|adj. 全面的|The report gives a comprehensive overview.
conceive|kənˈsiːv|v. 构想|The design was conceived in the 1920s.`,

    business: `agenda|əˈdʒendə|n. 议事日程|Please review the meeting agenda.
asset|ˈæset|n. 资产|The company's main asset is its brand.
audit|ˈɔːdɪt|n. 审计|The annual audit starts next week.
brand|brænd|n. 品牌|We are building a strong brand image.
budget|ˈbʌdʒɪt|n. 预算|The marketing budget was cut this year.
client|ˈklaɪənt|n. 客户|Please reply to the client by Friday.
commerce|ˈkɒmɜːs|n. 商业|E-commerce is growing rapidly.
commission|kəˈmɪʃn|n. 佣金；委员会|The agent earns a 5% commission.
competitor|kəmˈpetɪtə|n. 竞争对手|Our competitors lowered their prices.
contract|ˈkɒntrækt|n. 合同|Both parties signed the contract.
corporation|ˌkɔːpəˈreɪʃn|n. 公司|She works for a large corporation.
deadline|ˈdedlaɪn|n. 截止日期|We must meet the deadline.
deficit|ˈdefɪsɪt|n. 赤字|The company reported a budget deficit.
dividend|ˈdɪvɪdend|n. 股息；红利|Shareholders received a dividend of 2%.
e-commerce|ˈiːkɒmɜːs|n. 电子商务|E-commerce has changed retail completely.
enterprise|ˈentəpraɪz|n. 企业|Small enterprises create many jobs.
entrepreneur|ˌɒntrəprəˈnɜː|n. 企业家|The entrepreneur started with one shop.
equity|ˈekwəti|n. 股本；公平|The firm raised equity from investors.
expense|ɪkˈspens|n. 费用|Travel expenses will be reimbursed.
export|ˈekspɔːt|n. 出口|Exports rose by 8% last quarter.
finance|ˈfaɪnæns|n. 财务|She works in the finance department.
forecast|ˈfɔːkɑːst|n. 预测|The sales forecast looks positive.
franchise|ˈfræntʃaɪz|n. 特许经营权|They opened a franchise in Shanghai.
import|ˈɪmpɔːt|n. 进口|The country relies on imports of oil.
incentive|ɪnˈsentɪv|n. 激励|Bonuses are an incentive to work harder.
inflation|ɪnˈfleɪʃn|n. 通货膨胀|Inflation reached 3% this year.
inventory|ˈɪnvəntri|n. 库存|We need to reduce our inventory.
invoice|ˈɪnvɔɪs|n. 发票|Please send the invoice by email.
liability|ˌlaɪəˈbɪləti|n. 责任；负债|The company accepted liability for the damage.
logistics|əˈdʒɪstɪks|n. 物流|Logistics costs have increased sharply.`,

    oral: `actually|ˈæktʃuəli|adv. 实际上|Actually, I have never been there.
awesome|ˈɔːsəm|adj. 极好的|That was an awesome movie.
borrow|ˈbɒrəʊ|v. 借|Can I borrow your phone for a minute?
busy|ˈbɪzi|adj. 忙碌的|I am busy with work this week.
catch|kætʃ|v. 抓住；赶上|Let us catch the next train.
chill|tʃɪl|v. 放松；n. 寒意|We just chilled at home all day.
crazy|ˈkreɪzi|adj. 疯狂的|The traffic was crazy this morning.
definitely|ˈdefɪnətli|adv. 肯定地|I will definitely be there.
delicious|dɪˈlɪʃəs|adj. 美味的|This soup is really delicious.
exhausted|ɪɡˈzɔːstɪd|adj. 精疲力竭的|I was exhausted after the trip.
fancy|ˈfænsi|adj. 高档的；v. 想要|That is a fancy restaurant.
grab|ɡræb|v. 抓取；顺便吃|Let us grab a coffee.
gorgeous|ˈɡɔːdʒəs|adj. 漂亮的|You look gorgeous today.
hang out|hæŋ aʊt|phr. 闲逛|We hung out at the mall yesterday.
hilarious|hɪˈleəriəs|adj. 滑稽的|His story was hilarious.
hungry|ˈhʌŋɡri|adj. 饥饿的|I am so hungry right now.
kid|kɪd|n. 小孩；v. 开玩笑|Are you kidding me?
kidding|ˈkɪdɪŋ|v. 开玩笑|I am just kidding with you.
literally|ˈlɪtərəli|adv. 字面上；确实|I literally forgot my keys.
mad|mæd|adj. 生气的；疯狂的|She was mad at me for being late.
mess|mes|n. 混乱|My room is a total mess.
nap|næp|n. 小睡|I took a short nap after lunch.
okay|ˌəʊˈkeɪ|adj. 可以的|Is it okay if I open the window?
pretty|ˈprɪti|adv. 相当；adj. 漂亮的|That is pretty good news.
quite|kwaɪt|adv. 相当|The test was quite difficult.
relax|rɪˈlæks|v. 放松|You need to relax a little.
stuff|stʌf|n. 东西|Where did you put my stuff?
tired|ˈtaɪəd|adj. 疲倦的|I feel tired after a long day.
weird|wɪəd|adj. 奇怪的|That sounds a bit weird.
whatever|wɒtˈevə|pron. 无论什么|Whatever you say is fine with me.`,

    workplace: `absent|ˈæbsənt|adj. 缺席的|He was absent from the meeting yesterday.
annual leave|ˌænjuəl ˈliːv|n. 年假|I will take annual leave next month.
apply|əˈplaɪ|v. 申请|She applied for the manager position.
appraisal|əˈpreɪzl|n. 绩效考核|The annual appraisal is in December.
approve|əˈpruːv|v. 批准|The director approved the new budget.
assignment|əˈsaɪnmənt|n. 任务|This assignment is due on Friday.
colleague|ˈkɒliːɡ|n. 同事|My colleagues are very helpful.
conference|ˈkɒnfərəns|n. 会议|The conference will be held online.
deadline|ˈdedlaɪn|n. 截止日期|We need to meet the deadline.
delegate|ˈdelɪɡeɪt|v. 委派|Good managers delegate tasks wisely.
department|dɪˈpɑːtmənt|n. 部门|I work in the marketing department.
efficiency|ɪˈfɪʃnsi|n. 效率|We should improve work efficiency.
feedback|ˈfiːdbæk|n. 反馈|Please give me some feedback on the report.
interview|ˈɪntəvjuː|n. 面试|The interview lasted about an hour.
meeting|ˈmiːtɪŋ|n. 会议|The meeting starts at nine sharp.
memo|ˈmeməʊ|n. 备忘录|The manager sent a short memo.
negotiate|nɪˈɡəʊʃieɪt|v. 谈判|We are negotiating with the supplier.
overtime|ˈəʊvətaɪm|n. 加班|He worked overtime three days this week.
position|pəˈzɪʃn|n. 职位|She applied for a position in sales.
presentation|ˌpreznˈteɪʃn|n. 演示|Your presentation was clear and well organised.
promotion|prəˈməʊʃn|n. 晋升|He got a promotion after two years.
proposal|prəˈpəʊzl|n. 提案|The proposal was accepted by the board.
recruit|rɪˈkruːt|v. 招聘|We plan to recruit two engineers.
resign|rɪˈzaɪn|v. 辞职|She resigned from the company last week.
resume|ˈrezjumeɪ|n. 简历|Please send us your resume by email.
schedule|ˈʃedjuːl|n. 日程|The schedule has been updated.
seminar|ˈsemɪnɑː|n. 研讨会|I attended a seminar on leadership.
staff|stɑːf|n. 员工|All staff must attend the training.
supervisor|ˈsuːpəvaɪzə|n. 主管|Ask your supervisor before you leave.
teamwork|ˈtiːmwɜːk|n. 团队合作|Teamwork is essential in this project.`
  };

  const BOOKS = [
    { id: 'primary', name: '小学基础', group: '基础词库', icon: '🌱' },
    { id: 'junior', name: '初中必备', group: '基础词库', icon: '🌿' },
    { id: 'senior', name: '高中必备', group: '基础词库', icon: '🌳' },
    { id: 'cet4', name: '大学四级', group: '进阶词库', icon: '🎓' },
    { id: 'cet6', name: '大学六级', group: '进阶词库', icon: '📘' },
    { id: 'kaoyan', name: '考研核心', group: '进阶词库', icon: '📚' },
    { id: 'ielts', name: '雅思核心', group: '进阶词库', icon: '🌍' },
    { id: 'toefl', name: '托福核心', group: '进阶词库', icon: '🎧' },
    { id: 'business', name: '商务英语', group: '专项词库', icon: '💼' },
    { id: 'oral', name: '日常口语', group: '专项词库', icon: '☕' },
    { id: 'workplace', name: '职场英语', group: '专项词库', icon: '🏢' }
  ];

  // 解析词库
  const parseWords = function (bookId, raw) {
    return raw.split('\n').filter(Boolean).map(function (line, i) {
      const p = line.split('|');
      return {
        key: bookId + ':' + p[0],
        book: bookId,
        word: p[0].trim(),
        phon: p[1] ? p[1].trim() : '',
        mean: p[2] ? p[2].trim() : '',
        example: p[3] ? p[3].trim() : '',
        idx: i
      };
    });
  };
  const WORD_MAP = {};
  const BOOK_WORDS = {};
  const EXTRA = global.WG_EXTRA_WORDS || {};
  // 工业 / 设备调试高频词，合并到「职场英语」词库，方便工作场景优先练习
  const INDUSTRIAL_RAW = `sensor|'sɛnsɚ|传感器
conveyor|kən'veɚ|输送带；传送带
cutter|'kʌtɚ|切割机；刀具
motor|'motɚ|电机；马达
roller|'rolɚ|滚筒；辊轴
valve|vælv|阀门
pump|pʌmp|泵
gear|gɪr|齿轮
belt|bɛlt|皮带
switch|swɪtʃ|开关；切换
machine|mə'ʃin|机器
equipment|ɪ'kwɪpmənt|设备
production|prə'dʌkʃən|生产
assembly|ə'sɛmbli|装配；组装
inspection|ɪn'spɛkʃən|检查；检验
defect|'difɛkt|缺陷
quality|'kwɑləti|质量
maintenance|'mentənəns|维护；保养
repair|rɪ'pɛr|修理
automation|,ɔtə'meʃən|自动化
robot|'robɑt|机器人
control|kən'trol|控制
system|'sɪstəm|系统
voltage|'voltɪdʒ|电压
current|'kɝənt|电流
pressure|'prɛʃɚ|压力
temperature|'tɛmprətʃɚ|温度
alarm|ə'lɑrm|警报
error|'ɛrɚ|错误
reset|,ri'sɛt|复位；重置
start|stɑrt|启动
stop|stɑp|停止
pause|pɔz|暂停
button|'bʌtn|按钮
screen|skrin|屏幕
display|dɪ'sple|显示
interface|'ɪntɚfes|界面；接口
database|'detəbes|数据库
network|'nɛtwɝk|网络
server|'sɝvɚ|服务器
process|'prɑsɛs|过程；加工
output|'aʊtpʊt|产出；输出
input|'ɪnpʊt|输入`;
  EXTRA.workplace = (EXTRA.workplace || '') + '\n' + INDUSTRIAL_RAW;
  BOOKS.forEach(function (b) {
    const raw = (RAW[b.id] || '') + (EXTRA[b.id] ? '\n' + EXTRA[b.id] : '');
    const list = parseWords(b.id, raw);
    BOOK_WORDS[b.id] = list;
    b.total = list.length;
    list.forEach(function (w) { WORD_MAP[w.key] = w; });
  });

  /* ---------- 种子 ---------- */
  // tier: 1 普通 / 2 稀有 / 3 珍稀；type: veg 蔬菜 / flower 花卉
  const SEEDS = [
    { id: 'cabbage', name: '白菜', icon: '🥬', type: 'veg', tier: 1, growSec: 600, cost: 1, points: 3, exp: 3, price: 2 },
    { id: 'radish', name: '萝卜', icon: '🥕', type: 'veg', tier: 1, growSec: 900, cost: 1, points: 3, exp: 3, price: 2 },
    { id: 'greens', name: '青菜', icon: '🥗', type: 'veg', tier: 1, growSec: 1200, cost: 2, points: 4, exp: 3, price: 3 },
    { id: 'tomato', name: '番茄', icon: '🍅', type: 'veg', tier: 2, growSec: 1800, cost: 3, points: 8, exp: 8, price: 6 },
    { id: 'cucumber', name: '黄瓜', icon: '🥒', type: 'veg', tier: 2, growSec: 2700, cost: 4, points: 10, exp: 8, price: 8 },
    { id: 'strawberry', name: '草莓', icon: '🍓', type: 'veg', tier: 2, growSec: 3600, cost: 5, points: 12, exp: 8, price: 10 },
    { id: 'blueberry', name: '蓝莓', icon: '🫐', type: 'veg', tier: 3, growSec: 7200, cost: 8, points: 20, exp: 15, price: 16, drop: 'petFoodAdvanced' },
    { id: 'grape', name: '葡萄', icon: '🍇', type: 'veg', tier: 3, growSec: 10800, cost: 12, points: 28, exp: 15, price: 22, drop: 'petExpShard' },
    { id: 'mango', name: '芒果', icon: '🥭', type: 'veg', tier: 3, growSec: 14400, cost: 15, points: 36, exp: 15, price: 28, drop: 'petAccessory' },
    { id: 'sunflower', name: '向日葵', icon: '🌻', type: 'flower', tier: 1, growSec: 900, cost: 1, points: 2, exp: 4, price: 2 },
    { id: 'daisy', name: '小雏菊', icon: '🌼', type: 'flower', tier: 1, growSec: 1200, cost: 2, points: 2, exp: 4, price: 3 },
    { id: 'morningglory', name: '牵牛花', icon: '🌸', type: 'flower', tier: 1, growSec: 1800, cost: 2, points: 3, exp: 4, price: 3 },
    { id: 'rose', name: '玫瑰', icon: '🌹', type: 'flower', tier: 2, growSec: 3600, cost: 4, points: 6, exp: 9, price: 7, drop: 'decoShard' },
    { id: 'tulip', name: '郁金香', icon: '🌷', type: 'flower', tier: 2, growSec: 5400, cost: 6, points: 9, exp: 9, price: 10, drop: 'decoShard' },
    { id: 'bluebell', name: '风铃草', icon: '🪻', type: 'flower', tier: 2, growSec: 7200, cost: 7, points: 11, exp: 9, price: 12, drop: 'decoShard' },
    { id: 'epiphyllum', name: '昙花', icon: '🌺', type: 'flower', tier: 3, growSec: 14400, cost: 10, points: 18, exp: 16, price: 20, drop: 'deco_skin' },
    { id: 'peony', name: '牡丹', icon: '🏵️', type: 'flower', tier: 3, growSec: 18000, cost: 12, points: 22, exp: 16, price: 24, drop: 'deco_effect' },
    { id: 'jacaranda', name: '蓝楹花', icon: '💠', type: 'flower', tier: 3, growSec: 28800, cost: 15, points: 28, exp: 16, price: 30, drop: 'petAccessory' }
  ];
  const SEED_MAP = {};
  SEEDS.forEach(function (s) {
    s.unlockLevel = s.tier === 1 ? 1 : (s.tier === 2 ? 4 : 7);
    s.cat = 'plant';
    SEED_MAP[s.id] = s;
  });

  const TIER_NAME = { 1: '普通', 2: '稀有', 3: '珍稀' };
  const TIER_GROW_EXP = { 1: 3, 2: 8, 3: 15 };

  /* ---------- 道具 ---------- */
  const ITEMS = {
    water: { id: 'water', name: '浇水壶', icon: '💧', cat: 'plant', price: 2, desc: '给作物浇水，缩短 12% 生长时间（每块地最多 3 次）', limit: 20 },
    fertilizer: { id: 'fertilizer', name: '肥料', icon: '🌱', cat: 'plant', price: 3, desc: '施肥，缩短 12% 生长时间（每块地最多 3 次）', limit: 20 },
    speedup: { id: 'speedup', name: '加速剂', icon: '⚡', cat: 'plant', price: 5, desc: '立即缩短 50% 剩余生长时间', limit: 10 },
    shield: { id: 'shield', name: '花园守护卡', icon: '🛡️', cat: 'plant', price: 8, desc: '开启 1 小时花园防护，好友无法偷取作物', limit: 5 },

    petFoodBasic: { id: 'petFoodBasic', name: '基础宠物粮', icon: '🍚', cat: 'pet', price: 2, desc: '投喂宠物，饱腹值 +30，宠物经验 +2', limit: 30 },
    petFoodAdvanced: { id: 'petFoodAdvanced', name: '高级宠物粮', icon: '🍖', cat: 'pet', price: 6, desc: '投喂宠物，饱腹值 +60，宠物经验 +5', limit: 15, reqLearnLevel: 5 },
    petAccessory: { id: 'petAccessory', name: '宠物配饰', icon: '🎀', cat: 'pet', price: 12, desc: '解锁宠物配饰外观，提升亲密度表现', limit: 5 },
    petExpShard: { id: 'petExpShard', name: '宠物升级碎片', icon: '✨', cat: 'pet', price: 10, desc: '使用后宠物经验 +30', limit: 10 },
    petRenameCard: { id: 'petRenameCard', name: '宠物改名卡', icon: '📛', cat: 'pet', price: 4, desc: '给你的萌宠换个新名字', limit: 3 },

    deco_tile: { id: 'deco_tile', name: '花园地砖', icon: '🧱', cat: 'deco', price: 30, desc: '花园摆件：木纹地砖，装扮后花园经验 +30', limit: 1, once: true },
    deco_fence: { id: 'deco_fence', name: '花园围栏', icon: '🚧', cat: 'deco', price: 25, desc: '花园摆件：原木围栏，装扮后花园经验 +30', limit: 1, once: true },
    deco_ornament: { id: 'deco_ornament', name: '田园摆件', icon: '🏡', cat: 'deco', price: 40, desc: '花园摆件：小木屋摆件，装扮后花园经验 +40', limit: 1, once: true },
    deco_bg: { id: 'deco_bg', name: '基础花园背景', icon: '🖼️', cat: 'deco', price: 60, desc: '解锁基础花园背景皮肤', limit: 1, once: true, reqGardenLevel: 6 },
    deco_bg_custom: { id: 'deco_bg_custom', name: '自定义花园背景', icon: '🌈', cat: 'deco', price: 120, desc: '解锁自定义花园背景，花园经验 +100', limit: 1, once: true, reqGardenLevel: 10 },
    deco_effect: { id: 'deco_effect', name: '作物特效', icon: '✨', cat: 'deco', price: 80, desc: '成熟作物额外星光特效', limit: 1, once: true },
    deco_skin: { id: 'deco_skin', name: '限定花园皮肤', icon: '🎨', cat: 'deco', price: 150, desc: '节日限定花园皮肤，花园经验 +100', limit: 1, once: true, reqGardenLevel: 7 },
    decoShard: { id: 'decoShard', name: '装饰碎片', icon: '🔹', cat: 'deco', price: 0, desc: '收获稀有花卉获得，可兑换花园装饰', limit: 0, noSell: true },

    wrongClearCard: { id: 'wrongClearCard', name: '错题清零卡', icon: '🧽', cat: 'study', price: 15, desc: '清空当前错题本中的全部错题', limit: 3 },
    reviewDoubleCard: { id: 'reviewDoubleCard', name: '复习加倍卡', icon: '🔁', cat: 'study', price: 12, desc: '使用后 1 小时内复习积分翻倍', limit: 3 },
    makeupCard: { id: 'makeupCard', name: '打卡补签卡', icon: '📅', cat: 'study', price: 20, desc: '补签 1 天连续打卡记录', limit: 2 },

    fishFood: { id: 'fishFood', name: '鱼食', icon: '🪱', cat: 'fish', price: 2, desc: '投喂鱼群，缩短 12% 生长时间（每个鱼池最多 3 次）', limit: 20 },
    fishSpeed: { id: 'fishSpeed', name: '鱼池增氧剂', icon: '🫧', cat: 'fish', price: 5, desc: '立即缩短 50% 剩余生长时间', limit: 10 },
    fishShield: { id: 'fishShield', name: '鱼池防护网', icon: '🕸️', cat: 'fish', price: 8, desc: '开启 1 小时鱼池防护，好友无法偷鱼', limit: 5 },

    animalFeed: { id: 'animalFeed', name: '禽畜饲料', icon: '🌾', cat: 'livestock', price: 3, desc: '投喂禽畜，缩短 12% 产物产出时间（每只最多 3 次）', limit: 20 },
    animalSpeed: { id: 'animalSpeed', name: '催长素', icon: '💉', cat: 'livestock', price: 6, desc: '立即缩短 50% 剩余产出时间', limit: 10 },
    animalShield: { id: 'animalShield', name: '牧场围栏', icon: '🚧', cat: 'livestock', price: 8, desc: '开启 1 小时牧场防护，好友无法偷取产物', limit: 5 },

    orchardFert: { id: 'orchardFert', name: '果树肥料', icon: '🍂', cat: 'orchard', price: 3, desc: '给果树施肥，缩短 12% 生长时间（每棵最多 3 次）', limit: 20 },
    orchardSpeed: { id: 'orchardSpeed', name: '果树催熟剂', icon: '☀️', cat: 'orchard', price: 5, desc: '立即缩短 50% 剩余生长时间', limit: 10 },
    orchardShield: { id: 'orchardShield', name: '果园防鸟网', icon: '🪺', cat: 'orchard', price: 8, desc: '开启 1 小时果园防护，好友无法偷取果实', limit: 5 }
  };

  const SHOP_CATS = [
    { id: 'plant', name: '种植类', icon: '🌾' },
    { id: 'orchard', name: '果木类', icon: '🍎' },
    { id: 'fish', name: '养鱼类', icon: '🐟' },
    { id: 'livestock', name: '养殖类', icon: '🐔' },
    { id: 'pet', name: '宠物类', icon: '🐾' },
    { id: 'deco', name: '装饰类', icon: '🎨' },
    { id: 'study', name: '学习辅助', icon: '📖' }
  ];

  /* ---------- 学习等级（10 级） ---------- */
  const LEARN_LEVELS = [
    { lv: 1, name: '单词萌新', exp: 0, minWords: 0, acc: 70, perk: '解锁基础词库、基础花园地块、新手宠物领养资格' },
    { lv: 2, name: '初学起步', exp: 80, minWords: 51, acc: 72, perk: '解锁单词闯关模式、每日积分小幅加成 5%' },
    { lv: 3, name: '稳步积累', exp: 200, minWords: 151, acc: 75, perk: '解锁稀有种子兑换权限、每日闯关次数 +1' },
    { lv: 4, name: '记忆达人', exp: 360, minWords: 301, acc: 78, perk: '解锁错题本特权、作物生长加速 8%' },
    { lv: 5, name: '单词能手', exp: 580, minWords: 501, acc: 80, perk: '解锁高级宠物粮食兑换、每日积分上限提升 10%' },
    { lv: 6, name: '深耕学习', exp: 850, minWords: 801, acc: 82, perk: '解锁珍稀花卉种子、花园防护时长延长 20%' },
    { lv: 7, name: '学霸进阶', exp: 1200, minWords: 1201, acc: 85, perk: '解锁高阶宠物、复习单词积分加成 15%' },
    { lv: 8, name: '词汇精通', exp: 1650, minWords: 1801, acc: 87, perk: '解锁专属花园皮肤、每日偷菜次数上限 +5' },
    { lv: 9, name: '词汇大佬', exp: 2200, minWords: 2501, acc: 90, perk: '解锁限定宠物碎片掉落、所有养成加成提升 20%' },
    { lv: 10, name: '单词宗师', exp: 2850, minWords: 3500, acc: 92, perk: '解锁全部词库、全部种子道具、终身学习特权、专属荣誉铭牌' }
  ];

  /* ---------- 花园等级（15 级） ---------- */
  const GARDEN_LEVELS = [
    { lv: 1, exp: 0, plots: 6, perk: '解锁基础 6 块地块、普通蔬菜/花卉种子，开启基础种植、偷菜玩法' },
    { lv: 2, exp: 60, plots: 6, perk: '解锁宠物系统领养资格，开启好友互助收益' },
    { lv: 3, exp: 140, plots: 6, perk: '基础种子收益 +5%，解锁简易花园摆件装饰' },
    { lv: 4, exp: 260, plots: 10, perk: '新增 4 块地块，解锁稀有种子兑换权限，互助积分收益 +10%' },
    { lv: 5, exp: 420, plots: 10, perk: '作物枯萎损耗降低 10%，每日免费领取初级肥料 ×1' },
    { lv: 6, exp: 620, plots: 12, perk: '新增 2 块地块，稀有作物产出概率 +8%，解锁基础花园背景' },
    { lv: 7, exp: 860, plots: 12, perk: '解锁珍稀种子兑换权限，作物枯萎损耗降低 20%' },
    { lv: 8, exp: 1140, plots: 16, perk: '新增 4 块地块，花园防护基础时长 +10%' },
    { lv: 9, exp: 1460, plots: 16, perk: '高阶作物积分收益 +12%，每日免费守护卡 ×1' },
    { lv: 10, exp: 1820, plots: 20, perk: '解锁 20 块满配地块，枯萎损耗降低 30%，自定义花园背景' },
    { lv: 11, exp: 2220, plots: 26, perk: '新增 6 块高阶地块，守护卡防护时长翻倍' },
    { lv: 12, exp: 2660, plots: 26, perk: '稀有、珍稀作物掉落概率 +15%，偷菜上限次数 +3' },
    { lv: 13, exp: 3140, plots: 28, perk: '解锁 28 块高阶地块，所有种植道具兑换折扣 5%' },
    { lv: 14, exp: 3660, plots: 28, perk: '珍稀作物生长速度 +10%，解锁高阶花园特效' },
    { lv: 15, exp: 4220, plots: 30, perk: '解锁全部 30 块地块，道具无限制兑换，全自动打理、专属荣誉铭牌' }
  ];

  /* ---------- 宠物等级（10 级） ---------- */
  const PET_LEVELS = [
    { lv: 1, exp: 0, grow: 5, perk: '基础积分微量产出，作物生长加速 5%' },
    { lv: 2, exp: 50, grow: 6, freeFood: 1, perk: '每日自动产出基础粮食 ×1，作物加速 6%' },
    { lv: 3, exp: 120, grow: 8, reviewPts: 5, perk: '单词复习积分加成 5%，作物加速 8%' },
    { lv: 4, exp: 210, grow: 12, reviewPts: 10, freeWater: 2, perk: '每日免费浇水道具 ×2，复习加成 10%，加速 12%' },
    { lv: 5, exp: 320, grow: 12, shieldPct: 15, perk: '花园基础防护时长 +15%，错题复习效率提升 8%' },
    { lv: 6, exp: 450, grow: 15, reviewExp: 10, perk: '作物加速 15%，每日单词复习经验 +10%' },
    { lv: 7, exp: 600, grow: 15, steal: 2, shieldPct: 20, perk: '偷菜每日上限 +2，花园防护时长 +20%' },
    { lv: 8, exp: 770, grow: 20, learnPts: 12, perk: '所有学习收益 +12%，作物加速 20%' },
    { lv: 9, exp: 960, grow: 20, rareDrop: 10, perk: '稀有种子掉落概率 +10%，错题复习效率提升 15%' },
    { lv: 10, exp: 1180, grow: 25, learnPts: 20, quizBonus: 1, perk: '所有学习收益 +20%、作物生长全程加速 25%、每日额外闯关次数 +1，解锁神宠专属铭牌' }
  ];

  /* ---------- 亲密度星级（5 星） ---------- */
  const INTIMACY_LEVELS = [
    { star: 1, exp: 0, perk: '解锁基础宠物待机动作，基础增益生效' },
    { star: 2, exp: 100, perk: '解锁基础宠物配饰，互动动画升级' },
    { star: 3, exp: 220, expBonus: 5, perk: '解锁专属待机特效，日常经验获取 +5%' },
    { star: 4, exp: 380, rareDrop: 8, perk: '解锁限定宠物皮肤、专属互动动作，稀有掉落 +8%' },
    { star: 5, exp: 580, allBonus: 5, perk: '专属荣誉铭牌、每日随机掉落稀有种子碎片 ×1，所有增益 +5%' }
  ];

  /* ---------- 宠物种类 ---------- */
  const PET_SPECIES = [
    { id: 'cat', name: '小白猫', icon: '🐱', desc: '温柔粘人的小白猫，喜欢晒太阳', reqGardenLevel: 2, starter: true, bubble: ['喵~ 今天也要背单词哦', '摸摸头最舒服啦', '花园里的蝴蝶好多呀'] },
    { id: 'dog', name: '小黄狗', icon: '🐶', desc: '忠诚活泼的小黄狗，爱帮你看家', reqGardenLevel: 2, starter: true, bubble: ['汪！主人回来啦', '我帮你看守花园', '一起去散步好不好'] },
    { id: 'rabbit', name: '棉花兔', icon: '🐰', desc: '软软的棉花兔，跳得比谁都快', reqGardenLevel: 4, bubble: ['蹦蹦跳跳真开心', '胡萝卜最美味了', '今天学了几个新词呀'] },
    { id: 'hamster', name: '仓鼠球', icon: '🐹', desc: '腮帮子鼓鼓的仓鼠，囤粮小能手', reqGardenLevel: 5, bubble: ['我把粮食藏好啦', '跑轮好好玩', '单词卡片也囤起来'] },
    { id: 'parrot', name: '彩虹鹦鹉', icon: '🦜', desc: '会念单词的彩虹鹦鹉，学习小助手', reqGardenLevel: 7, bubble: ['Hello! 今天背单词了吗', '跟我读：flower', '我最聪明啦'] },
    { id: 'deer', name: '森林小鹿', icon: '🦌', desc: '安静优雅的小鹿，来自森林深处', reqGardenLevel: 9, bubble: ['森林里有好多花', '谢谢你照顾我', '一起看星星吧'] },
    { id: 'unicorn', name: '星光独角兽', icon: '🦄', desc: '节日限定的梦幻伙伴，只在特别的日子出现', reqGardenLevel: 12, limited: true, bubble: ['星光会照亮你的单词路', '我们是命中注定的伙伴', '许个愿吧'] }
  ];
  const PET_MAP = {};
  PET_SPECIES.forEach(function (p) { PET_MAP[p.id] = p; });

  /* ---------- 鱼池等级（10 级） ---------- */
  const FISH_POND_LEVELS = [
    { lv: 1, exp: 0, slots: 4, perk: '解锁基础 4 个鱼池，开启养鱼玩法' },
    { lv: 2, exp: 40, slots: 4, perk: '解锁金鱼养殖，鱼类收益 +5%' },
    { lv: 3, exp: 100, slots: 6, perk: '新增 2 个鱼池，解锁锦鲤' },
    { lv: 4, exp: 200, slots: 6, perk: '鱼类生长加速 8%，每日免费鱼食 ×1' },
    { lv: 5, exp: 340, slots: 8, perk: '新增 2 个鱼池，解锁热带鱼' },
    { lv: 6, exp: 520, slots: 8, perk: '鱼类收益 +10%，鱼池防护时长 +10%' },
    { lv: 7, exp: 740, slots: 10, perk: '新增 2 个鱼池，解锁龙鱼' },
    { lv: 8, exp: 1000, slots: 10, perk: '鱼类生长加速 12%，偷鱼上限 +2' },
    { lv: 9, exp: 1300, slots: 12, perk: '新增 2 个鱼池，稀有鱼掉落 +8%' },
    { lv: 10, exp: 1650, slots: 12, perk: '解锁全部鱼池，鱼类全自动打理，专属荣誉铭牌' }
  ];

  /* ---------- 鱼种 ---------- */
  const FISH_SPECIES = [
    { id: 'carp', name: '鲤鱼', icon: '🐟', tier: 1, growSec: 600, cost: 1, points: 3, exp: 3, price: 2 },
    { id: 'crucian', name: '鲫鱼', icon: '🐠', tier: 1, growSec: 900, cost: 1, points: 4, exp: 3, price: 3 },
    { id: 'goldfish', name: '金鱼', icon: '🐡', tier: 1, growSec: 1200, cost: 2, points: 5, exp: 4, price: 3 },
    { id: 'koi', name: '锦鲤', icon: '🎏', tier: 2, growSec: 1800, cost: 3, points: 9, exp: 8, price: 7, drop: 'fishFood' },
    { id: 'angelfish', name: '神仙鱼', icon: '🐙', tier: 2, growSec: 2700, cost: 4, points: 11, exp: 8, price: 9 },
    { id: 'tropical', name: '热带鱼', icon: '🦑', tier: 2, growSec: 3600, cost: 5, points: 13, exp: 9, price: 11, drop: 'fishSpeed' },
    { id: 'arowana', name: '龙鱼', icon: '🐉', tier: 3, growSec: 7200, cost: 9, points: 22, exp: 15, price: 18, drop: 'fishShield' },
    { id: 'discus', name: '七彩神仙', icon: '🌈', tier: 3, growSec: 10800, cost: 12, points: 30, exp: 16, price: 24 },
    { id: 'whale', name: '梦幻鲸', icon: '🐋', tier: 3, growSec: 14400, cost: 16, points: 40, exp: 18, price: 32, drop: 'petExpShard' }
  ];
  FISH_SPECIES.forEach(function (f) { f.unlockLevel = f.tier === 1 ? 1 : (f.tier === 2 ? 3 : 5); f.cat = 'fish'; });
  const FISH_MAP = {};
  FISH_SPECIES.forEach(function (f) { FISH_MAP[f.id] = f; });

  /* ---------- 牧场等级（10 级） ---------- */
  const LIVESTOCK_LEVELS = [
    { lv: 1, exp: 0, slots: 4, perk: '解锁基础 4 个禽畜栏，开启养殖玩法' },
    { lv: 2, exp: 40, slots: 4, perk: '解锁鸭子养殖，产物收益 +5%' },
    { lv: 3, exp: 100, slots: 6, perk: '新增 2 个栏位，解锁鹅' },
    { lv: 4, exp: 200, slots: 6, perk: '产出速度 +8%，每日免费饲料 ×1' },
    { lv: 5, exp: 340, slots: 8, perk: '新增 2 个栏位，解锁奶牛' },
    { lv: 6, exp: 520, slots: 8, perk: '产物收益 +10%，牧场防护时长 +10%' },
    { lv: 7, exp: 740, slots: 10, perk: '新增 2 个栏位，解锁绵羊' },
    { lv: 8, exp: 1000, slots: 10, perk: '产出速度 +12%，偷取上限 +2' },
    { lv: 9, exp: 1300, slots: 12, perk: '新增 2 个栏位，稀有产物掉落 +8%' },
    { lv: 10, exp: 1650, slots: 12, perk: '解锁全部栏位，全自动养殖，专属荣誉铭牌' }
  ];

  /* ---------- 禽畜品种 ---------- */
  // product: 产物图标名; productName; prodSec: 产出周期(秒); feedCost: 每次喂养积分消耗
  const LIVESTOCK_SPECIES = [
    { id: 'chicken', name: '母鸡', icon: '🐔', tier: 1, prodSec: 900, cost: 3, points: 5, exp: 3, price: 4, product: '🥚', productName: '鸡蛋' },
    { id: 'duck', name: '鸭子', icon: '🦆', tier: 1, prodSec: 1200, cost: 4, points: 6, exp: 4, price: 5, product: '🥚', productName: '鸭蛋' },
    { id: 'goose', name: '白鹅', icon: '🦢', tier: 2, prodSec: 1800, cost: 6, points: 10, exp: 8, price: 8, product: '🪶', productName: '鹅毛' },
    { id: 'cow', name: '奶牛', icon: '🐄', tier: 2, prodSec: 2700, cost: 8, points: 14, exp: 9, price: 11, product: '🥛', productName: '牛奶' },
    { id: 'sheep', name: '绵羊', icon: '🐑', tier: 3, prodSec: 3600, cost: 10, points: 18, exp: 12, price: 15, product: '🧶', productName: '羊毛' },
    { id: 'pig', name: '香猪', icon: '🐖', tier: 3, prodSec: 5400, cost: 14, points: 26, exp: 14, price: 21, product: '🥓', productName: '培根' }
  ];
  LIVESTOCK_SPECIES.forEach(function (a) { a.unlockLevel = a.tier === 1 ? 1 : (a.tier === 2 ? 3 : 5); a.cat = 'livestock'; });
  const LIVESTOCK_MAP = {};
  LIVESTOCK_SPECIES.forEach(function (a) { LIVESTOCK_MAP[a.id] = a; });

  /* ---------- 果园等级（10 级） ---------- */
  const ORCHARD_LEVELS = [
    { lv: 1, exp: 0, slots: 4, perk: '解锁基础 4 棵果树，开启果园玩法' },
    { lv: 2, exp: 40, slots: 4, perk: '解锁桃、梨，果实收益 +5%' },
    { lv: 3, exp: 100, slots: 6, perk: '新增 2 棵果树，解锁柑橘类' },
    { lv: 4, exp: 200, slots: 6, perk: '果树生长加速 8%，每日免费肥料 ×1' },
    { lv: 5, exp: 340, slots: 8, perk: '新增 2 棵果树，解锁热带水果' },
    { lv: 6, exp: 520, slots: 8, perk: '果实收益 +10%，果园防护时长 +10%' },
    { lv: 7, exp: 740, slots: 10, perk: '新增 2 棵果树，解锁珍稀水果' },
    { lv: 8, exp: 1000, slots: 10, perk: '果树生长加速 12%，偷取上限 +2' },
    { lv: 9, exp: 1300, slots: 12, perk: '新增 2 棵果树，稀有果实掉落 +8%' },
    { lv: 10, exp: 1650, slots: 12, perk: '解锁全部果树，全自动打理，专属荣誉铭牌' }
  ];

  /* ---------- 水果品种 ---------- */
  const FRUIT_SPECIES = [
    { id: 'apple', name: '苹果', icon: '🍎', tier: 1, growSec: 600, cost: 1, points: 3, exp: 3, price: 2 },
    { id: 'pear', name: '梨', icon: '🍐', tier: 1, growSec: 900, cost: 1, points: 4, exp: 3, price: 3 },
    { id: 'peach', name: '桃子', icon: '🍑', tier: 1, growSec: 1200, cost: 2, points: 5, exp: 4, price: 3 },
    { id: 'tangerine', name: '橘子', icon: '🍊', tier: 1, growSec: 1200, cost: 2, points: 5, exp: 4, price: 3 },
    { id: 'lemon', name: '柠檬', icon: '🍋', tier: 1, growSec: 1500, cost: 2, points: 6, exp: 4, price: 4 },
    { id: 'cherry', name: '樱桃', icon: '🍒', tier: 2, growSec: 1800, cost: 3, points: 9, exp: 8, price: 7, drop: 'orchardFert' },
    { id: 'strawberry', name: '草莓', icon: '🍓', tier: 2, growSec: 2100, cost: 3, points: 10, exp: 8, price: 8 },
    { id: 'grape', name: '葡萄', icon: '🍇', tier: 2, growSec: 2700, cost: 4, points: 12, exp: 8, price: 9 },
    { id: 'watermelon', name: '西瓜', icon: '🍉', tier: 2, growSec: 3000, cost: 5, points: 14, exp: 9, price: 11, drop: 'orchardSpeed' },
    { id: 'banana', name: '香蕉', icon: '🍌', tier: 2, growSec: 3600, cost: 5, points: 15, exp: 9, price: 12 },
    { id: 'mango', name: '芒果', icon: '🥭', tier: 2, growSec: 4200, cost: 6, points: 17, exp: 10, price: 13 },
    { id: 'pineapple', name: '菠萝', icon: '🍍', tier: 2, growSec: 4800, cost: 7, points: 19, exp: 10, price: 15 },
    { id: 'kiwi', name: '猕猴桃', icon: '🥝', tier: 3, growSec: 7200, cost: 9, points: 24, exp: 15, price: 19, drop: 'orchardShield' },
    { id: 'coconut', name: '椰子', icon: '🥥', tier: 3, growSec: 9000, cost: 10, points: 28, exp: 16, price: 22 },
    { id: 'pomegranate', name: '石榴', icon: '🍅', tier: 3, growSec: 10800, cost: 12, points: 32, exp: 16, price: 25 },
    { id: 'dragonfruit', name: '火龙果', icon: '🐉', tier: 3, growSec: 12600, cost: 13, points: 36, exp: 17, price: 28, drop: 'petExpShard' },
    { id: 'lychee', name: '荔枝', icon: '🔴', tier: 3, growSec: 14400, cost: 15, points: 40, exp: 18, price: 32 },
    { id: 'durian', name: '榴莲', icon: '🟢', tier: 3, growSec: 18000, cost: 18, points: 50, exp: 20, price: 40, drop: 'decoShard' }
  ];
  FRUIT_SPECIES.forEach(function (f) { f.unlockLevel = f.tier === 1 ? 1 : (f.tier === 2 ? 3 : 5); f.cat = 'orchard'; });
  const FRUIT_MAP = {};
  FRUIT_SPECIES.forEach(function (f) { FRUIT_MAP[f.id] = f; });

  /* ---------- 每日任务 ---------- */
  const TASKS = [
    { id: 'study10', name: '今日背诵 10 个单词', icon: '📗', metric: 'wordsToday', target: 10, reward: { points: 5, exp: 10 }, jump: 'learn' },
    { id: 'study20', name: '今日背诵 20 个单词', icon: '📘', metric: 'wordsToday', target: 20, reward: { points: 10, exp: 20, items: { petFoodBasic: 1 } }, jump: 'learn' },
    { id: 'study50', name: '今日背诵 50 个单词', icon: '📙', metric: 'wordsToday', target: 50, reward: { points: 20, exp: 40 }, jump: 'learn' },
    { id: 'help3', name: '完成 3 次好友互助', icon: '🤝', metric: 'help', target: 3, reward: { points: 6, exp: 10 }, jump: 'friends' },
    { id: 'harvest5', name: '收获 5 块成熟作物', icon: '🧺', metric: 'harvest', target: 5, reward: { points: 8, exp: 15, items: { fertilizer: 1 } }, jump: 'garden' },
    { id: 'feed1', name: '完成 1 次宠物喂养', icon: '🍖', metric: 'feed', target: 1, reward: { points: 4, exp: 5 }, jump: 'pet' },
    { id: 'quiz1', name: '完成 1 轮单词闯关', icon: '🏆', metric: 'quiz', target: 1, reward: { points: 6, exp: 10 }, jump: 'learn' }
  ];
  const CHEST = {
    id: 'chest', name: '每日专属宝箱', icon: '🎁',
    reward: { points: 15, items: { 'seed_random_rare': 1, petFoodAdvanced: 1 } }
  };

  /* ---------- 好友（本地模拟） ---------- */
  const FRIENDS = [
    { id: 'f1', name: '单词小王子', icon: '🤴', lv: 12, online: true, tag: '学霸' },
    { id: 'f2', name: '花园小园丁', icon: '👩‍🌾', lv: 9, online: true, tag: '种植达人' },
    { id: 'f3', name: '喵喵爱背词', icon: '🐱', lv: 7, online: false, tag: '养宠达人' },
    { id: 'f4', name: '凌晨四点的猫', icon: '🌙', lv: 14, online: true, tag: '夜猫子' },
    { id: 'f5', name: '草莓味的云', icon: '🍓', lv: 5, online: false, tag: '萌新' },
    { id: 'f6', name: '背词不打烊', icon: '🌞', lv: 11, online: true, tag: '打卡王' },
    { id: 'f7', name: '一只小仓鼠', icon: '🐹', lv: 6, online: false, tag: '囤粮王' },
    { id: 'f8', name: '英语角常客', icon: '🎤', lv: 8, online: true, tag: '口语控' }
  ];

  /* ---------- 排行榜机器人 ---------- */
  const RANK_BOTS = [
    { name: '单词小王子', icon: '🤴', words: 3860, acc: 96, gardenLv: 14, rareFlower: 62, petLv: 10, intimacy: 580 },
    { name: '凌晨四点的猫', icon: '🌙', words: 3420, acc: 94, gardenLv: 14, rareFlower: 55, petLv: 9, intimacy: 520 },
    { name: '背词不打烊', icon: '🌞', words: 3120, acc: 93, gardenLv: 13, rareFlower: 48, petLv: 9, intimacy: 470 },
    { name: '花园小园丁', icon: '👩‍🌾', words: 2680, acc: 91, gardenLv: 13, rareFlower: 44, petLv: 8, intimacy: 430 },
    { name: '英语角常客', icon: '🎤', words: 2210, acc: 90, gardenLv: 11, rareFlower: 36, petLv: 8, intimacy: 390 },
    { name: '喵喵爱背词', icon: '🐱', words: 1860, acc: 88, gardenLv: 10, rareFlower: 30, petLv: 7, intimacy: 350 },
    { name: '一只小仓鼠', icon: '🐹', words: 1580, acc: 87, gardenLv: 9, rareFlower: 26, petLv: 7, intimacy: 300 },
    { name: '草莓味的云', icon: '🍓', words: 1240, acc: 85, gardenLv: 8, rareFlower: 20, petLv: 6, intimacy: 260 },
    { name: '词汇收藏家', icon: '📚', words: 960, acc: 84, gardenLv: 7, rareFlower: 16, petLv: 6, intimacy: 220 },
    { name: '清晨读书声', icon: '🌅', words: 720, acc: 82, gardenLv: 6, rareFlower: 12, petLv: 5, intimacy: 180 },
    { name: '慢慢来就好', icon: '🍃', words: 480, acc: 80, gardenLv: 5, rareFlower: 8, petLv: 4, intimacy: 140 },
    { name: '刚入门的小新', icon: '🌱', words: 260, acc: 78, gardenLv: 4, rareFlower: 5, petLv: 3, intimacy: 100 }
  ];

  const AVATARS = ['🌻', '🌷', '🍀', '🐱', '🐶', '🐰', '🦊', '🐼', '🌙', '⭐', '🍓', '🍑', '🌵', '🦄'];

  /* ---------- 天气 ---------- */
  const WEATHER = [
    { id: 'sunny', name: '晴天', icon: '☀️', desc: '作物生长速度 +5%', grow: 0.05, color: '#f6c453' },
    { id: 'breeze', name: '微风', icon: '🍃', desc: '作物生长速度 +12%，心情愉悦', grow: 0.12, color: '#8fd19e' },
    { id: 'dewdrop', name: '晨露', icon: '💧', desc: '变异概率 +3%，稀有掉落提升', grow: 0, mutBonus: 0.03, color: '#7bc4e8' },
    { id: 'cloudy', name: '多云', icon: '⛅', desc: '普通天气，无特殊加成', grow: 0, color: '#b8c4d0' },
    { id: 'rainy', name: '小雨', icon: '🌧️', desc: '自动浇水效果，生长 +3%', grow: 0.03, color: '#8fa9c7' }
  ];
  const WEATHER_MAP = {};
  WEATHER.forEach(function (w) { WEATHER_MAP[w.id] = w; });

  /* ============================================================
     双币种经济系统
     ------------------------------------------------------------
     · 学习积分 learnPoints —— 唯一来源是「背单词」
       可用于：购买种子 / 树苗 / 鱼苗 / 禽畜幼崽 / 学习辅助道具
     · 收获积分 points   —— 来源是收获、出售、任务、签到等经营行为
       仅可用于：购买养料（浇水/施肥/饲料/鱼食…）与周边（装饰、宠物用品）
     ============================================================ */
  const CUR = { LEARN: 'learn', FARM: 'farm' };

  // 所有兑换价格与积分产出统一放大 3.5 倍（数值更重、经营感更强，比例保持不变）
  const POINT_SCALE = 3.5;
  function scalePoint(v) {
    const n = Number(v) || 0;
    if (!n) return 0;
    return Math.round(n * POINT_SCALE * 100) / 100;
  }

  // 生产投入品 → 学习积分购买；成本与产出同步缩放
  [SEEDS, FRUIT_SPECIES, FISH_SPECIES, LIVESTOCK_SPECIES].forEach(function (list) {
    list.forEach(function (x) {
      x.currency = CUR.LEARN;
      x.cost = scalePoint(x.cost);
      x.points = scalePoint(x.points);
      x.price = scalePoint(x.price);
    });
  });

  // 道具：学习辅助类用学习积分，其余（养料 / 周边 / 宠物用品）用收获积分
  Object.keys(ITEMS).forEach(function (id) {
    const it = ITEMS[id];
    it.currency = it.cat === 'study' ? CUR.LEARN : CUR.FARM;
    if (it.price > 0) it.price = scalePoint(it.price);
  });

  // 任务 / 宝箱的积分奖励同步缩放，避免产出与物价脱节
  TASKS.forEach(function (t) {
    if (t.reward && t.reward.points) t.reward.points = scalePoint(t.reward.points);
  });
  CHEST.reward.points = scalePoint(CHEST.reward.points);

  global.WG = global.WG || {};
  global.WG.data = {
    BOOKS, BOOK_WORDS, WORD_MAP, SEEDS, SEED_MAP, TIER_NAME, TIER_GROW_EXP,
    ITEMS, SHOP_CATS, LEARN_LEVELS, GARDEN_LEVELS, PET_LEVELS, INTIMACY_LEVELS,
    PET_SPECIES, PET_MAP, TASKS, CHEST, FRIENDS, RANK_BOTS, AVATARS,
    WEATHER, WEATHER_MAP,
    FISH_SPECIES, FISH_MAP, FISH_POND_LEVELS,
    LIVESTOCK_SPECIES, LIVESTOCK_MAP, LIVESTOCK_LEVELS,
    ORCHARD_LEVELS, FRUIT_SPECIES, FRUIT_MAP,
    CUR, POINT_SCALE, scalePoint
  };
})(window);
