"""
Stride — Wordlist for generating memorable pairing codes (word-word-word).
300 common, safe, easy-to-type English words → 300^3 = 27 M combinations.
"""
import secrets

WORDS = [
    "able","acid","aged","also","area","army","aunt","back","ball","band",
    "base","bath","bear","beat","bell","best","bird","bite","blue","boat",
    "body","bone","book","born","bowl","burn","call","calm","camp","card",
    "care","cash","cave","cell","chip","city","clay","clip","club","coal",
    "coat","code","coin","cold","cook","cool","core","corn","cost","crew",
    "crop","cure","dark","data","date","dawn","deal","dean","dear","debt",
    "deep","desk","diet","dirt","disk","dive","door","dose","draw","drop",
    "drum","duck","dusk","dust","duty","each","earn","ease","east","edge",
    "emit","even","evil","face","fact","fail","fair","fake","fall","fame",
    "farm","fast","fate","fear","feet","fell","felt","file","fill","film",
    "find","fine","fire","firm","fish","fist","flag","flat","flip","fold",
    "folk","font","food","fool","ford","fork","form","fort","free","fuel",
    "full","fund","fuse","gain","game","gear","gene","gift","give","glad",
    "glow","glue","goal","gold","golf","gone","good","grab","gray","grew",
    "grid","grin","grip","grow","gulf","gust","half","hall","hand","hang",
    "hard","harm","hash","head","heal","heat","heel","held","help","herb",
    "hero","high","hill","hint","hold","hole","home","hood","hook","hope",
    "horn","host","hour","huge","hull","hunt","hurt","inch","iris","iron",
    "isle","jade","jazz","jolt","jump","just","keen","keep","kite","knee",
    "knot","lack","lake","land","lane","lark","last","late","lava","lawn",
    "lead","leaf","leap","left","lend","lens","lift","like","lily","lime",
    "link","lion","list","live","load","lock","loft","long","look","loom",
    "loop","lord","lore","lose","loss","loud","love","luck","lure","made",
    "main","make","mark","mart","mask","mass","mast","mate","maze","meal",
    "mean","meet","melt","menu","mesh","mild","milk","mill","mind","mine",
    "mint","mist","mode","moon","more","most","move","much","mull","myth",
    "nail","name","navy","need","nest","next","nice","node","none","noon",
    "norm","nose","note","numb","oath","once","only","open","oval","oven",
    "over","page","pair","park","part","pass","past","path","peak","pear",
    "peel","peer","pick","pine","pink","pipe","plan","play","plea","plot",
]


def generate_code() -> str:
    """Return a random word-word-word code from the wordlist."""
    return "-".join(secrets.choice(WORDS) for _ in range(3))
