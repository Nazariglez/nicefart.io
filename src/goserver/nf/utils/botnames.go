/**
 * Created by nazarigonzalez on 11/10/16.
 */

package utils

import (
	"math/rand"
	"strconv"
	"strings"
)

var botNames = [...]string{
	"Abigail", "Alexandra", "Alison", "Amanda", "Amelia", "Amy", "Andrea", "Angela", "Anna",
	"Anne", "Audrey", "Ava", "Bella", "Carol", "Caroline", "Carolyn", "Chloe", "Claire",
	"Deirdre", "Diana", "Diane", "Donna", "Dorothy", "Elizabeth", "Ella", "Emily", "Emma",
	"Faith", "Felicity", "Fiona", "Gabrielle", "Grace", "Hannah", "Heather", "Irene", "Jan",
	"Jane", "Jasmine", "Jennifer", "Jessica", "Joan", "Joanne", "Julia", "Karen", "Katherine",
	"Kimberly", "Kylie", "Lauren", "Leah", "Lillian", "Lily", "Lisa", "Madeleine", "Maria", "Mary",
	"Megan", "Melanie", "Michelle", "Molly", "Natalie", "Nicola", "Olivia", "Penelope", "Pippa", "Rachel",
	"Rebecca", "Rose", "Ruth", "Sally", "Samantha", "Sarah", "Sonia", "Sophie", "Stephanie", "Sue",
	"Theresa", "Tracey", "Una", "Vanessa", "Victoria", "Virginia", "Wanda", "Wendy", "Yvonne", "Zoe",
	"Adam", "Adrian", "Alan", "Alexander", "Andrew", "Anthony", "Austin", "Benjamin", "Blake", "Boris",
	"Brandon", "Brian", "Cameron", "Carl", "Charles", "Christian", "Colin", "Connor", "Dan", "David",
	"Dominic", "Dylan", "Edward", "Eric", "Evan", "Frank", "Gavin", "Gordon", "Harry", "Ian", "Isaac",
	"Jack", "Jacob", "Jake", "James", "Jason", "Joe", "John", "Jonathan", "Joseph", "Joshua", "Julian",
	"Justin", "Keith", "Kevin", "Leonard", "Liam", "Lucas", "Luke", "Matt", "Max", "Michael", "Nathan",
	"Neil", "Nicholas", "Oliver", "Owen", "Paul", "Peter", "Phil", "Piers", "Richard", "Robert", "Ryan",
	"Sam", "Sean", "Sebastian", "Simon", "Stephen", "Steven", "Stewart", "Thomas", "Tim", "Trevor",
	"Victor", "Warren", "William", "Abraham", "Allan", "Alsop", "Anderson", "Arnold", "Avery", "Bailey",
	"Baker", "Ball", "Bell", "Berry", "Black", "Blake", "Bond", "Bower", "Brown", "Buckland",
	"Burgess", "Butler", "Cameron", "Campbell", "Carr", "Chapman", "Churchill", "Clark", "Clarkson",
	"Coleman", "Cornish", "Davidson", "Davies", "Dickens", "Dowd", "Duncan", "Dyer", "Edmunds",
	"Ellison", "Ferguson", "Fisher", "Forsyth", "Fraser", "Gibson", "Gill", "Glover", "Graham",
	"Grant", "Gray", "Greene", "Hamilton", "Hardacre", "Harris", "Hart", "Hemmings", "Henderson",
	"Hill", "Hodges", "Howard", "Hudson", "Hughes", "Hunter", "Ince", "Jackson", "James", "Johnston",
	"Jones", "Kelly", "Kerr", "King", "Knox", "Lambert", "Langdon", "Lawrence", "Lee", "Lewis",
	"Lyman", "MacDonald", "Mackay", "Mackenzie", "MacLeod", "Manning", "Marshall", "Martin", "Mathis",
	"May", "McDonald", "McLean", "McGrath", "Metcalfe", "Miller", "Mills", "Mitchell", "Morgan",
	"Morrison", "Murray", "Nash", "Newman", "Nolan", "North", "Ogden", "Oliver", "Paige", "Parr",
	"Parsons", "Paterson", "Payne", "Peake", "Peters", "Piper", "Poole", "Powell", "Pullman",
	"Quinn", "Rampling", "Randall", "Rees", "Reid", "Roberts", "Robertson", "Ross", "Russell",
	"Sanderson", "Scott", "Sharp", "Short", "Simpson", "Skinner", "Slater", "Smith", "Springer",
	"Stewart", "Taylor", "Terry", "Thomson", "Tucker", "Turner", "Underwood", "Vance", "Vaughan",
	"Walker", "Wallace", "Walsh", "Watson", "Welch", "Wilkins", "Wilson", "Wright", "Young", "Erin",
	"Ron", "Ronnie", "Ab", "Abe", "Eb", "Ebbie", "Abby", "Gail", "Nabby", "Ada", "Addy", "Delia",
	"Dell", "Lena", "Adele", "Della", "Heidi", "Delphia", "Philly", "Aggy", "Inez", "Nessa", "Allie",
	"Al", "Bert", "Bertie", "Rich", "Riche", "Alex", "Sandy", "Alla", "Sandra", "Fred", "Freddy", "Alfy",
	"Freda", "Frieda", "Elsie", "Mena", "Lon", "Lonzo", "Manda", "Mandy", "Mel", "Millie", "Andy", "Drew",
	"Annie", "Nan", "Nana", "Nancy", "Nanny", "Tony", "Ann", "Netta", "Ara", "Arry", "Belle", "Archie",
	"Arly", "Art", "Asa", "Assene", "Natty", "Sene", "Gus", "Gatsy", "Gussie", "Tina", "August", "Aze",
	"Riah", "Bab", "Babs", "Barby", "Bobbie", "Barney", "Bart", "Bartel", "Bat", "Mees", "Meus", "Bea",
	"Trisha", "Trix", "Trixie", "Linda", "Ben", "Bennie", "Benjy", "Jamie", "Berney", "Bernie", "Birdie",
	"Brad", "Ford", "Biddie", "Biddy", "Bridgie", "Bridie", "Brady", "Brody", "Rick", "Ricky", "Cal",
	"Vin", "Vinny", "Cam", "Ronny", "Cammie", "Carrie", "Cassie", "Lynn", "Carole", "K.C.", "Cathy",
	"Kathy", "Katy", "Kay", "Kit", "Kittie", "Trina", "Celia", "Cissy", "Ced", "Charlie", "Chick",
	"Chuck", "Char", "Lotta", "Lottie", "Sherry", "Chan", "Chet", "Chris", "Christy", "Crissy",
	"Kris", "Kristy", "Chrissy", "Clair", "Clare", "Clara", "Clem", "Cliff", "Clum", "Con", "Conny",
	"Connie", "Cordy", "Cornie", "Corny", "Nelia", "Nelle", "Nelly", "Niel", "Court", "Curt", "Cindy",
	"Cintha", "Cene", "Cy", "Renius", "Serene", "Swene", "Dahl", "Danny", "Darry", "Dave", "Davey",
	"Day", "Deb", "Debbie", "Debby", "Del", "Delly", "Dilly", "Dee", "Lola", "Lolly", "Denny", "Dicie",
	"Dom", "Don", "Donnie", "Donny", "Dony", "Darkey", "Dolly", "Dortha", "Dot", "Dotty", "Eben", "Ed",
	"Eddie", "Eddy", "Edie", "Edye", "Ned", "Ted", "Teddy", "Win", "Albert", "Elaine", "Ellen", "Ellie",
	"Lanna", "Lenora", "Nora", "Lazar", "Eli", "Lias", "Lige", "Left", "Lish", "Bess", "Bessie", "Beth",
	"Betsy", "Betty", "Eliza", "Lib", "Libby", "Liz", "Liza", "Lizzie", "Elsey", "Elly", "Mira", "Louise",
	"Woody", "Manny", "Manuel", "Em", "Emmy", "Milly", "Dite", "Ditus", "Dyce", "Dyche", "Eppa", "Eph",
	"Ernie", "Essy", "Stella", "Gene", "Eva", "Eve", "Ez", "Zeke", "Fay", "Felty", "Ferdie", "Freddie",
	"Flo", "Flora", "Flossy", "Fanny", "Fran", "Francie", "Frankie", "Frannie", "Franniey", "Sis",
	"Fritz", "Ricka", "Gabby", "Gabe", "Jean", "Jenny", "Geoff", "Jeff", "Gerry", "Jerry", "Dina",
	"Gerrie", "Gert", "Gertie", "Trudy", "Gil", "Wilber", "Gwen", "Hal", "Hattie", "Eloise", "Elouise",
	"Lois", "Etta", "Etty", "Hank", "Nettie", "Retta", "Hipsie", "Herb", "Hermie", "Esther", "Hessy",
	"Hetty", "Hez", "Hy", "Kiah", "Hop", "Hopp", "Horry", "Hub", "Hugh", "Iggy", "Nace", "Nate", "Natius",
	"Rena", "Irv", "Ike", "Ib", "Issy", "Nib", "Nibby", "Tibbie", "Dora", "Izzy", "Jaap", "Jay", "Jem",
	"Jim", "Jimmie", "Jimmy", "Janie", "Jennie", "Jessie", "Jeannie", "Janet", "Jed", "Sonny", "Hiel",
	"Mima", "Jereme", "Jo", "Nonie", "Jody", "Jock", "Johnny", "Joey", "Jos", "Fina", "Josey", "Josh",
	"Joy", "Nita", "Jud", "Jill", "Julie", "Jule", "JR", "June", "Junie", "Kate", "Kaye", "Ken", "Kenny",
	"Kendrick", "Kizza", "Kizzie", "Kim", "Fate", "Laffie", "Monty", "Larry", "Lonny", "Lorne", "Lorry",
	"Ina", "Vina", "Viney", "Lem", "Len", "Lenny", "Leo", "Leon", "Lineau", "L.R.", "Roy", "Les",
	"Lettice", "Lettie", "Tish", "Titia", "Lyddy", "Lil", "Lilly", "Link", "Lindy", "Alice", "Melissa",
	"Loren", "Lorrie", "Lou", "Cille", "Lu", "Lucy", "Lula", "Maddy", "Madge", "Magda", "Maggie",
	"Hallie", "Mark", "Daisy", "Gretta", "Maggy", "Marge", "Margery", "Margie", "Margy", "Meg", "Midge",
	"Peg", "Peggy", "Rita", "Marty", "Mat", "Mattie", "Patsy", "Patty", "Marv", "Mae", "Mamie", "Mitzi",
	"Polly", "Matty", "Maud", "Tilly", "Thias", "Thys", "Morey", "Hitty", "Mabel", "Mitty", "Mindy",
	"Lissa", "Missy", "Merv", "Micah", "Mick", "Micky", "Mike", "Mickey", "Minnie", "Randy", "Mimi",
	"Mitch", "Gum", "Nap", "Nappy", "Nat", "Than", "Claas", "Claes", "Nick", "Norby", "Diah", "Obed",
	"Obie", "Livia", "Nollie", "Ollie", "Ossy", "Ozzy", "Waldo", "Pam", "Melia", "Pat", "Tricia",
	"Paddy", "Pate", "Lina", "Perry", "Penny", "Percy", "Pete", "Leet", "Pres", "Scotty", "Cilla",
	"Prissy", "Prudy", "Prue", "Shelly", "Rafa", "Dolph", "Ralph", "Ray", "Becca", "Beck", "Becky",
	"Reba", "Gina", "Reggie", "Naldo", "Reg", "Renny", "Leafa", "Rube", "Dick", "Dickie", "Dickon",
	"Dicky", "Bob", "Bobby", "Dob", "Dobbin", "Hob", "Hobkin", "Rob", "Robbie", "Hodge", "Robby",
	"Robin", "Rod", "Roge", "Rupert", "Lanny", "Orlando", "Rollo", "Rolly", "Rosa", "Roz", "Rosie",
	"Roxie", "Olph", "Rolf", "Rudy", "Russ", "Rusty", "Brina", "Sammy", "Cassandra", "Sadie", "See",
	"Shel", "Sher", "Shirl", "Sid", "Syd", "Si", "Sion", "Smitty", "Sal", "Salmon", "Saul", "Sol",
	"Solly", "Zolly", "Steve", "Steph", "Stu", "Sully", "Van", "Sukey", "Susie", "Suzie", "Sly", "Sy",
	"Syl", "Vessie", "Vester", "Vet", "Tabby", "Thad", "Theo", "Tess", "Tessa", "Tessie", "Thirza",
	"Thursa", "Tracy", "Tom", "Tommy", "Thom", "Timmy", "Bias", "Toby", "Phena", "Val", "Essa", "Vanna",
	"Franky", "Frony", "Ronie", "Ronna", "Vonnie", "Vic", "Torie", "Tory", "Vicki", "Vicky", "Vince",
	"Vinnie", "Ginger", "Ginny", "Virgy", "Wally", "Walt", "Wash", "Will", "Willie", "Willy", "Mina",
	"Wilma", "Bela", "Bill", "Billy", "Field", "Winny", "Winnet", "Winnie", "Wood", "Vonna", "Zach",
	"Zachy", "Zeb", "Zed", "Zeph", "sheryl", "sher", "ann", "Nik",
}

var additives = [...]string{
	"Red", "Green", "Blue", "Yellow", "White", "Black", "Orange", "Brown",
	"Purple", "Pink", "Cow", "Wolf", "Snail", "Bat", "Dolphin", "Dog",
	"Bird", "Bull", "Cat", "Fox", "Metal", "Hyper", "Super", "Mega", "LoL", "Noob",
	"Best", "Worst", "Lamer", "Zoo", "Spain",
	"Aruba", "Benin", "Chad", "Chile", "China", "Congo", "Cuba", "Egypt", "Fiji", "Gabon", "Ghana",
	"Guam", "Haiti", "India", "Iraq", "Italy", "Japan", "Kenya", "Macao", "Mali", "Malta", "Nauru",
	"Nepal", "Niger", "Niue", "Oman", "Palau", "Peru", "Qatar", "Samoa", "Spain", "Sudan", "Togo",
	"Tonga", "Yemen",
}

func GetRandomBotName() string {
	name := botNames[rand.Intn(len(botNames))]

	spaces := []string{"_", "_", "_", "_", "-", "-", "-", ".", " ", " "}
	space := spaces[rand.Intn(len(spaces))]

	if len(name) > 10 {
		name = name[:6]
	}

	var add string
	//add a additive
	if rand.Float64() < 0.15 {

		//suffix
		add = additives[rand.Intn(len(additives))]
		if rand.Float64() < 0.4 {
			name += space + add
		} else {
			name += add
		}

	} else if rand.Float64() < 0.15 {

		//prefix
		add = additives[rand.Intn(len(additives))]
		if rand.Float64() < 0.4 {
			name = add + space + name
		} else {
			name = add + name
		}

	}

	if rand.Float64() < 0.30 {
		//lowercase
		_name := ""
		for i := 0; i < len(name); i++ {
			_name += strings.ToLower(name[i : i+1])
		}

		if len(_name) != 0 {
			name = _name
		}

	} else if rand.Float64() < 0.20 {
		//camelcase
		_name := ""
		up := rand.Float64() < 0.5

		for i := 0; i < len(name); i++ {
			if up {
				_name += strings.ToUpper(name[i : i+1])
			} else {
				_name += strings.ToLower(name[i : i+1])
			}

			up = !up
		}

		if len(_name) != 0 {
			name = _name
		}

	} else if rand.Float64() < 0.10 {
		//uppercase
		_name := ""
		for i := 0; i < len(name); i++ {
			_name += strings.ToUpper(name[i : i+1])
		}

		if len(_name) != 0 {
			name = _name
		}

	}

	if len(name) < 11 {
		if rand.Float64() < 0.15 {
			rnd := rand.Intn(99)
			if rand.Float64() < 0.4 {
				name += space + strconv.Itoa(rnd)
			} else {
				name += strconv.Itoa(rnd)
			}
		}
	}

	if len(name) > 12 {
		if rand.Float64() < 0.2 {
			return "Guest"
		}

		return GetRandomBotName()
	}

	return name
}
