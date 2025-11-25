"""
Seed script to populate the database with amazing curated writings.

This script adds wonderful examples from literature, speeches, poetry, and essays
that writers can browse through for inspiration.
"""

from database import get_db, Writing, init_db
from logger_config import logger
from datetime import datetime

# Curated amazing writings from literature, speeches, and poetry
CURATED_WRITINGS = [
    {
        "title": "The Road Not Taken",
        "author": "Robert Frost",
        "genre": "Poetry",
        "content": """Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference."""
    },
    {
        "title": "I Have a Dream",
        "author": "Martin Luther King Jr.",
        "genre": "Speech",
        "content": """I say to you today, my friends, so even though we face the difficulties of today and tomorrow, I still have a dream. It is a dream deeply rooted in the American dream.

I have a dream that one day this nation will rise up and live out the true meaning of its creed: "We hold these truths to be self-evident, that all men are created equal."

I have a dream that one day on the red hills of Georgia, the sons of former slaves and the sons of former slave owners will be able to sit down together at the table of brotherhood.

I have a dream that one day even the state of Mississippi, a state sweltering with the heat of injustice, sweltering with the heat of oppression, will be transformed into an oasis of freedom and justice.

I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.

I have a dream today!"""
    },
    {
        "title": "The Great Gatsby - Opening",
        "author": "F. Scott Fitzgerald",
        "genre": "Prose",
        "content": """In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.

"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."

He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores."""
    },
    {
        "title": "If",
        "author": "Rudyard Kipling",
        "genre": "Poetry",
        "content": """If you can keep your head when all about you
Are losing theirs and blaming it on you,
If you can trust yourself when all men doubt you,
But make allowance for their doubting too;
If you can wait and not be tired by waiting,
Or being lied about, don't deal in lies,
Or being hated, don't give way to hating,
And yet don't look too good, nor talk too wise:

If you can dream—and not make dreams your master;
If you can think—and not make thoughts your aim;
If you can meet with Triumph and Disaster
And treat those two impostors just the same;
If you can bear to hear the truth you've spoken
Twisted by knaves to make a trap for fools,
Or watch the things you gave your life to, broken,
And stoop and build 'em up with worn-out tools:

If you can make one heap of all your winnings
And risk it on one turn of pitch-and-toss,
And lose, and start again at your beginnings
And never breathe a word about your loss;
If you can force your heart and nerve and sinew
To serve your turn long after they are gone,
And so hold on when there is nothing in you
Except the Will which says to them: "Hold on!"

If you can talk with crowds and keep your virtue,
Or walk with Kings—nor lose the common touch,
If neither foes nor loving friends can hurt you,
If all men count with you, but none too much;
If you can fill the unforgiving minute
With sixty seconds' worth of distance run,
Yours is the Earth and everything that's in it,
And—which is more—you'll be a Man, my son!"""
    },
    {
        "title": "Gettysburg Address",
        "author": "Abraham Lincoln",
        "genre": "Speech",
        "content": """Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.

Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.

But, in a larger sense, we can not dedicate—we can not consecrate—we can not hallow—this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us—that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion—that we here highly resolve that these dead shall not have died in vain—that this nation, under God, shall have a new birth of freedom—and that government of the people, by the people, for the people, shall not perish from the earth."""
    },
    {
        "title": "Sonnet 18",
        "author": "William Shakespeare",
        "genre": "Poetry",
        "content": """Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date;
Sometime too hot the eye of heaven shines,
And often is his gold complexion dimm'd;
And every fair from fair sometime declines,
By chance or nature's changing course untrimm'd;
But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st;
Nor shall death brag thou wander'st in his shade,
When in eternal lines to time thou grow'st:
So long as men can breathe or eyes can see,
So long lives this, and this gives life to thee."""
    },
    {
        "title": "The Declaration of Independence - Opening",
        "author": "Thomas Jefferson",
        "genre": "Essay",
        "content": """When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.

We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.—That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed, —That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness."""
    },
    {
        "title": "O Captain! My Captain!",
        "author": "Walt Whitman",
        "genre": "Poetry",
        "content": """O Captain! my Captain! our fearful trip is done,
The ship has weather'd every rack, the prize we sought is won,
The port is near, the bells I hear, the people all exulting,
While follow eyes the steady keel, the vessel grim and daring;
But O heart! heart! heart!
O the bleeding drops of red,
Where on the deck my Captain lies,
Fallen cold and dead.

O Captain! my Captain! rise up and hear the bells;
Rise up—for you the flag is flung—for you the bugle trills,
For you bouquets and ribbon'd wreaths—for you the shores a-crowding,
For you they call, the swaying mass, their eager faces turning;
Here Captain! dear father!
This arm beneath your head!
It is some dream that on the deck,
You've fallen cold and dead.

My Captain does not answer, his lips are pale and still,
My father does not feel my arm, he has no pulse nor will,
The ship is anchor'd safe and sound, its voyage closed and done,
From fearful trip the victor ship comes in with object won;
Exult O shores, and ring O bells!
But I with mournful tread,
Walk the deck my Captain lies,
Fallen cold and dead."""
    },
    {
        "title": "The Raven - Excerpt",
        "author": "Edgar Allan Poe",
        "genre": "Poetry",
        "content": """Once upon a midnight dreary, while I pondered, weak and weary,
Over many a quaint and curious volume of forgotten lore—
While I nodded, nearly napping, suddenly there came a tapping,
As of some one gently rapping, rapping at my chamber door.
"'Tis some visitor," I muttered, "tapping at my chamber door—
Only this and nothing more."

Ah, distinctly I remember it was in the bleak December;
And each separate dying ember wrought its ghost upon the floor.
Eagerly I wished the morrow;—vainly I had sought to borrow
From my books surcease of sorrow—sorrow for the lost Lenore—
For the rare and radiant maiden whom the angels name Lenore—
Nameless here for evermore."""
    },
    {
        "title": "The Love Song of J. Alfred Prufrock - Opening",
        "author": "T.S. Eliot",
        "genre": "Poetry",
        "content": """Let us go then, you and I,
When the evening is spread out against the sky
Like a patient etherized upon a table;
Let us go, through certain half-deserted streets,
The muttering retreats
Of restless nights in one-night cheap hotels
And sawdust restaurants with oyster-shells:
Streets that follow like a tedious argument
Of insidious intent
To lead you to an overwhelming question ...
Oh, do not ask, "What is it?"
Let us go and make our visit."""
    },
    {
        "title": "A Room of One's Own - Excerpt",
        "author": "Virginia Woolf",
        "genre": "Essay",
        "content": """A woman must have money and a room of her own if she is to write fiction; and that, as you will see, leaves the great problem of the true nature of woman and the true nature of fiction unsolved. I have shirked the duty of coming to a conclusion upon these two questions—women and fiction remain, so far as I am concerned, unsolved problems. But in order to make some amends I am going to do what I can to show you how I arrived at this opinion about the room and the money. I am going to develop in your presence as fully and freely as I can the train of thought which led me to think this. Perhaps if I lay bare the ideas, the prejudices, that lie behind this statement you will find that they have some bearing upon women and some upon fiction."""
    },
    {
        "title": "The Waste Land - Opening",
        "author": "T.S. Eliot",
        "genre": "Poetry",
        "content": """April is the cruellest month, breeding
Lilacs out of the dead land, mixing
Memory and desire, stirring
Dull roots with spring rain.
Winter kept us warm, covering
Earth in forgetful snow, feeding
A little life with dried tubers.
Summer surprised us, coming over the Starnbergersee
With a shower of rain; we stopped in the colonnade,
And went on in sunlight, into the Hofgarten,
And drank coffee, and talked for an hour."""
    },
    {
        "title": "Self-Reliance",
        "author": "Ralph Waldo Emerson",
        "genre": "Essay",
        "content": """Trust thyself: every heart vibrates to that iron string. Accept the place the divine providence has found for you, the society of your contemporaries, the connection of events. Great men have always done so, and confided themselves childlike to the genius of their age, betraying their perception that the absolutely trustworthy was seated at their heart, working through their hands, predominating in all their being. And we are now men, and must accept in the highest mind the same transcendent destiny; and not minors and invalids in a protected corner, not cowards fleeing before a revolution, but guides, redeemers, and benefactors, obeying the Almighty effort, and advancing on Chaos and the Dark."""
    },
    {
        "title": "The Tell-Tale Heart - Opening",
        "author": "Edgar Allan Poe",
        "genre": "Prose",
        "content": """True!—nervous—very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses—not destroyed—not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily—how calmly I can tell you the whole story."""
    },
    {
        "title": "Invictus",
        "author": "William Ernest Henley",
        "genre": "Poetry",
        "content": """Out of the night that covers me,
Black as the pit from pole to pole,
I thank whatever gods may be
For my unconquerable soul.

In the fell clutch of circumstance
I have not winced nor cried aloud.
Under the bludgeonings of chance
My head is bloody, but unbowed.

Beyond this place of wrath and tears
Looms but the Horror of the shade,
And yet the menace of the years
Finds and shall find me unafraid.

It matters not how strait the gate,
How charged with punishments the scroll,
I am the master of my fate,
I am the captain of my soul."""
    }
]


def seed_curated_writings():
    """Seed the database with curated amazing writings."""
    logger.info("Starting to seed curated writings...")
    
    # Initialize database
    init_db()
    
    db = next(get_db())
    try:
        # Check if curated writings already exist
        existing_curated = db.query(Writing).filter(Writing.category == "curated").count()
        if existing_curated > 0:
            logger.info(f"Found {existing_curated} existing curated writings. Skipping seed.")
            return
        
        # Add all curated writings
        added_count = 0
        for writing_data in CURATED_WRITINGS:
            try:
                writing = Writing(
                    title=writing_data["title"],
                    author=writing_data["author"],
                    content=writing_data["content"],
                    genre=writing_data["genre"],
                    category="curated",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(writing)
                added_count += 1
            except Exception as e:
                logger.error(f"Error adding writing '{writing_data['title']}': {e}")
        
        db.commit()
        logger.info(f"Successfully seeded {added_count} curated writings!")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding curated writings: {e}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_curated_writings()

