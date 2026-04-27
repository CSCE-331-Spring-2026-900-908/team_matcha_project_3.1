import csv
import random
from datetime import datetime, timedelta

# CONFIGURATION
NUM_WEEKS = 52
START_DATE = datetime(2025, 1, 1)
ICE_OPTIONS = ["No Ice", "Less Ice", "Regular Ice", "Extra Ice"]
SUGAR_OPTIONS = ["0%", "25%", "50%", "75%", "100%"]
TOPPING_COSTS = {
    "Boba": 0.50,
    "Red Bean": 0.50,
    "Lychee Jelly": 0.50,
    "Pudding": 0.50,
    "Crystal Boba": 0.75,
    "Mango Popping Boba": 0.75,
    "Ice Cream": 0.75,
    "Honey Jelly": 0.50,
}
TOPPING_OPTIONS = ["None", *TOPPING_COSTS.keys()]
TARGET_REVENUE = 1_000_000
NUM_MENU_ITEMS = 20
NUM_EMPLOYEES = 8
NUM_INVENTORY_ITEMS = 25

# 3 peak sales days
PEAK_DAYS = [
    datetime(2025, 2, 14),
    datetime(2025, 7, 4),
    datetime(2025, 12, 25)
]

# HELPER FUNCTIONS
def random_time():
    hour = random.randint(10, 21)  # store hours 10AM–9PM
    minute = random.randint(0, 59)
    return hour, minute

# --- INVENTORY ---
inventory_names = [
    "Cup (16oz)", "Cup Lid", "Straw",
    "Black Tea Leaves", "Green Tea Leaves", "Oolong Tea Leaves",
    "Milk", "Almond Milk", "Oat Milk",
    "Tapioca Pearls (Boba)", "Brown Sugar Syrup",
    "Honey Jelly", "Simple Syrup",
    "Taro Powder", "Matcha Powder",
    "Thai Tea Mix", "Wintermelon Syrup",
    "Passionfruit Syrup", "Lychee Syrup",
    "Peach Syrup", "Mango Syrup",
    "Strawberry Syrup", "Guava Syrup",
    "Pineapple Syrup", "Red Bean",
    "Lychee Jelly", "Pudding", "Crystal Boba",
    "Mango Popping Boba", "Ice Cream"
]

inventory_overrides = {
    "Honey Jelly": (0.50, 1758, 3),
    "Lychee Jelly": (0.50, 400, 0),
    "Pudding": (0.50, 300, 0),
    "Crystal Boba": (0.75, 253, 0),
    "Mango Popping Boba": (0.75, 413, 0),
    "Ice Cream": (0.75, 222, 0),
}

NUM_INVENTORY_ITEMS = len(inventory_names)
inventory_items = []


for i, name in enumerate(inventory_names, start=1):
    cost, stock, use_average = inventory_overrides.get(
        name,
        (round(random.uniform(0.50, 5.00), 2), random.randint(500, 2000), random.randint(1, 5))
    )
    inventory_items.append([
        i,
        name,
        cost,
        stock,
        use_average
    ])

with open("inventory.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["inventoryID", "name", "cost", "inventoryNum", "useAverage"])
    writer.writerows(inventory_items)

# --- MENU (20 BOBA DRINKS) ---
drink_names = [
    "Classic Milk Tea", "Taro Milk Tea", "Matcha Milk Tea",
    "Thai Milk Tea", "Honeydew Milk Tea", "Brown Sugar Milk Tea",
    "Strawberry Milk Tea", "Mango Milk Tea", "Oolong Milk Tea",
    "Wintermelon Fruit Tea", "Passionfruit Fruit Tea", "Lychee Fruit Tea",
    "Peach Green Tea", "Coconut Milk Tea", "Almond Milk Tea",
    "Coffee Milk Tea", "Red Bean Milk Tea", "Pineapple Fruit Tea",
    "Guava Green Tea", "Caramel Milk Tea"
]

drink_images = {
  "Classic Milk Tea": "https://th.bing.com/th/id/OIP.8xXkdh0DnYN3x8m6aZJHpgHaLH?w=127&h=190&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
  "Taro Milk Tea": "https://theoregondietitian.com/wp-content/uploads/2022/04/TaroMilkTea-1200-x-1200.jpg",
  "Matcha Milk Tea": "https://bestrecipesite.com/wp-content/uploads/2025/12/3-7.png",
  "Thai Milk Tea": "https://thai-foodie.com/wp-content/uploads/2024/09/thai-milk-tea.jpg",
  "Honeydew Milk Tea": "https://i.pinimg.com/originals/2e/17/2a/2e172a821300507745936d8765011cd8.jpg",
  "Brown Sugar Milk Tea": "https://www.alaynarecipes.com/wp-content/uploads/2025/12/x3by70tpodgucng1a1ik.webp",
  "Strawberry Milk Tea": "https://wellbeingbarista.com/wp-content/uploads/2023/09/strawberry_milk_tea.jpg",
  "Mango Milk Tea": "https://theoregondietitian.com/wp-content/uploads/2025/03/MangoMilkTea5-1200x1800-1-1024x1536.jpg",
  "Oolong Milk Tea": "https://ohsweetcups.com/wp-content/uploads/2023/06/627hookok-2.webp",
  "Wintermelon Fruit Tea": "https://homecozymagic.com/wp-content/uploads/2025/10/xcw73qpkz9tsteq03exy.webp",
  "Passionfruit Fruit Tea": "https://lastminrecipes.com/assets/images/1738869965154-bwcfgpxf.webp",
  "Lychee Fruit Tea": "https://hongthaimee.com/wp-content/uploads/2025/03/Lychee-Thai-Iced-Tea.png",
  "Peach Green Tea": "https://nutritiontofit.com/wp-content/uploads/2016/07/Peachy-Mint-Iced-Green-Tea.jpg",
  "Coconut Milk Tea": "https://img.freepik.com/premium-photo/photo-coconut-milk-tea-milky-tea-infused-with-coconut-flavor-toppe-front-view-clean-bg_655090-971803.jpg",
  "Almond Milk Tea": "https://balancewithjess.com/wp-content/uploads/2022/07/Almond-Milk-Tea-Feat.jpg",
  "Coffee Milk Tea": "https://tse1.mm.bing.net/th/id/OIP.8T7RoLDe7hAOnBqx4LDfhAHaJQ?rs=1&pid=ImgDetMain&o=7&rm=3",
  "Red Bean Milk Tea": "https://tse4.mm.bing.net/th/id/OIP.I5ek2jfGjLwdhhH2VmBbWwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  "Pineapple Fruit Tea": "https://bakewithshivesh.com/wp-content/uploads/2022/05/IMG-9753-scaled.jpg",
  "Guava Green Tea": "https://static.vecteezy.com/system/resources/previews/055/450/992/large_2x/refreshing-green-bubble-tea-featuring-chewy-tapioca-pearls-on-a-bright-white-background-green-bubble-tea-isolated-on-white-background-free-png.png",
  "Caramel Milk Tea": "https://foodsguy.com/wp-content/uploads/2022/04/pexels-kim-cruz-4071422-scaled.jpg"
}

menu_items = []
# Tracker to count total units sold for each menu item
sales_tracker = {i + 1: 0 for i in range(NUM_MENU_ITEMS)}

for i in range(NUM_MENU_ITEMS):
    price = round(random.uniform(4.50, 7.50), 2)
    name = drink_names[i]
    image_url = drink_images.get(name, "")
    # [menuID, name, price, salesNum, image_url]
    menu_items.append([i + 1, name, price, 0, image_url])

# --- MENU_ITEM (bridge table) ---
menu_item_bridge = []
bridge_id = 1

#Always used
CUP = 1
LID = 2
STRAW = 3
BLACK_TEA = 4
GREEN_TEA = 5
OOLONG_TEA = 6
MILK = 7
ALMOND_MILK = 8
OAT_MILK = 9
BOBA = 10
BROWN_SUGAR = 11
HONEY_JELLY = 12
SIMPLE_SYRUP = 13
TARO = 14
MATCHA = 15
THAI = 16
WINTERMELON = 17
PASSIONFRUIT = 18
LYCHEE = 19
PEACH = 20
MANGO = 21
STRAWBERRY = 22
GUAVA = 23
PINEAPPLE = 24
RED_BEAN = 25

for menu in menu_items:
    menu_id = menu[0]
    drink_name = menu[1]

    ingredients = {CUP, LID, STRAW}

    # Base Tea Logic
    if "Green Tea" in drink_name:
        ingredients.add(GREEN_TEA)
    elif "Oolong" in drink_name:
        ingredients.add(OOLONG_TEA)
    else:
        ingredients.add(BLACK_TEA)

    # Milk Teas
    if "Milk Tea" in drink_name:
        ingredients.add(MILK)
        ingredients.add(BOBA)

    # Specific Flavors
    if "Taro" in drink_name:
        ingredients.add(TARO)

    if "Matcha" in drink_name:
        ingredients.add(MATCHA)

    if "Thai" in drink_name:
        ingredients.add(THAI)

    if "Wintermelon" in drink_name:
        ingredients.add(WINTERMELON)

    if "Passionfruit" in drink_name:
        ingredients.add(PASSIONFRUIT)

    if "Lychee" in drink_name:
        ingredients.add(LYCHEE)

    if "Peach" in drink_name:
        ingredients.add(PEACH)

    if "Mango" in drink_name:
        ingredients.add(MANGO)

    if "Strawberry" in drink_name:
        ingredients.add(STRAWBERRY)

    if "Guava" in drink_name:
        ingredients.add(GUAVA)

    if "Pineapple" in drink_name:
        ingredients.add(PINEAPPLE)

    if "Red Bean" in drink_name:
        ingredients.add(RED_BEAN)

    if "Brown Sugar" in drink_name:
        ingredients.add(BROWN_SUGAR)

    # Add ingredients to bridge table
    for inv_id in ingredients:
        menu_item_bridge.append([
            bridge_id,
            inv_id,
            menu_id,
            random.randint(1, 3)
        ])
        bridge_id += 1

with open("menu_item.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["ID", "inventoryID", "menuID", "itemQuantity"])
    writer.writerows(menu_item_bridge)

# --- EMPLOYEES ---
employees = []
# Tracker to count total orders processed by each employee
employee_order_tracker = {i + 1: 0 for i in range(NUM_EMPLOYEES)}

for i in range(1, NUM_EMPLOYEES + 1):
    job = "Manager" if i == 1 else "Barista"
    employees.append([
        i,
        f"Employee_{i}",
        round(random.uniform(12, 20), 2),
        job,
        0 # orderNum (will be updated later)
    ])

# --- ORDERS + ORDER_HISTORY ---
orders = []
order_history = []
order_id = 1
total_revenue = 0

current_date = START_DATE
end_date = START_DATE + timedelta(weeks=NUM_WEEKS)

while current_date < end_date:
    # base daily orders
    daily_orders = random.randint(150, 170)

    # boost peak days
    if any(current_date.date() == peak.date() for peak in PEAK_DAYS):
        daily_orders *= 3

    for _ in range(daily_orders):
        hour, minute = random_time()
        order_time = current_date.replace(hour=hour, minute=minute)

        employee_id = random.randint(1, NUM_EMPLOYEES)
        # Update employee tracker
        employee_order_tracker[employee_id] += 1

        num_items = random.randint(1, 3)
        selected_menu = random.sample(menu_items, num_items)

        order_total = 0
        for menu in selected_menu:
            quantity = random.randint(1, 2)
            topping = random.choice(TOPPING_OPTIONS)
            topping_cost = TOPPING_COSTS.get(topping, 0.00)
            line_total = quantity * menu[2] + topping_cost
            order_total += line_total

            # UPDATE SALES TRACKER FOR THE MENU ITEM
            sales_tracker[menu[0]] += quantity

            order_history.append([
                len(order_history) + 1,
                menu[0],
                order_id,
                quantity,
                random.choice(ICE_OPTIONS),
                random.choice(SUGAR_OPTIONS),
                topping,
                menu[2]+topping_cost
            ])

        total_revenue += order_total

        orders.append([
            order_id,
            f"Customer_{order_id}",
            round(order_total, 2),
            employee_id,
            order_time.strftime("%Y-%m-%d %H:%M:%S")
        ])

        order_id += 1

    current_date += timedelta(days=1)

# --- FINAL SYNC: Update list values from trackers before writing ---

# Sync Sales Numbers to Menu List
for menu in menu_items:
    menu[3] = sales_tracker[menu[0]]

# Sync Order Counts to Employee List
for emp in employees:
    emp[4] = employee_order_tracker[emp[0]]

# --- WRITE FILES ---

print("Total Revenue Generated:", round(total_revenue, 2))

with open("menu.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["menuID", "name", "cost", "salesNum", "image_url"])
    writer.writerows(menu_items)

with open("employee.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["employeeID", "name", "pay", "job", "orderNum"])
    writer.writerows(employees)

with open("order.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["orderID", "customerName", "costTotal", "employeeID", "orderDateTime"])
    writer.writerows(orders)

with open("order_history.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["ID", "menuID", "orderID", "quantity", "iceLevel", "sugarLevel", "topping", "cost"])
    writer.writerows(order_history)

print("CSV files successfully generated.")
